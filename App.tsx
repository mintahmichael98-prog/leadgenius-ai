
import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Lead, SearchState, UserProfile, Transaction, LeadStatus, AppSettings, LeadFilters, INDUSTRIES } from './types';
import { generateLeadsBatch } from './services/geminiService';
import { enrichWithApollo } from './services/apolloService';
import { authService } from './services/authService';
import Dashboard from './components/Dashboard';
import LeadTable from './components/LeadTable';
import MapView from './components/MapView';
import PipelineBoard from './components/PipelineBoard';
import CompetitorScanner from './components/CompetitorScanner';
import EmailWarmup from './components/EmailWarmup';
import LookalikeFinder from './components/LookalikeFinder';
import EmailSequenceModal from './components/EmailSequenceModal';
import WhatsAppCampaignModal from './components/WhatsAppCampaignModal';
import SMSCampaignModal from './components/SMSCampaignModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { TermsModal, PrivacyModal } from './components/LegalModals';
import { ExportModal } from './components/ExportModal';
import SettingsModal from './components/SettingsModal';
import { exportDashboardToPDF } from './utils/exportPDF';
import { exportToHubSpot, exportToSalesforce } from './utils/exportCRM';
import { calculateLeadScore } from './utils/leadScore';
import toast, { Toaster } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import {
  Download, Moon, Sun, Search, LayoutDashboard, List, Database, Zap,
  CreditCard, LogOut, Star, Upload, Loader2, Filter, FileSpreadsheet, Ban, Map, MessageCircle, Kanban, Target, ShieldCheck, MessageSquare, Users, Settings as SettingsIcon, ChevronDown, ChevronUp, MapPin, Building, Menu, X, BarChart3, History
} from 'lucide-react';

const BATCH_SIZE = 10;
const MAX_BATCHES = 50;

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('leadgenius_dark_mode');
    return saved ? JSON.parse(saved) : true;
  });

  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    isSearching: false,
    progressStep: 0,
    batchesCompleted: 0,
    totalLeads: 0,
    error: null
  });

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<LeadFilters>({
    location: '',
    industry: '',
    employees: ''
  });

  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [favoriteSearches, setFavoriteSearches] = useState<any[]>([]);
  const [searchHistory, setSearchHistory] = useState<any[]>([]); // New State for History
  const [showHistory, setShowHistory] = useState(false); // New State for Dropdown

  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('leadgenius_settings');
    return saved ? JSON.parse(saved) : { webhookUrl: '', brandVoice: 'Professional, concise, and value-driven.' };
  });

  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<number>>(new Set());

  const [showPricing, setShowPricing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [showSMSModal, setShowSMSModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false); 
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const userRef = useRef<UserProfile | null>(null);
  userRef.current = user;

  useEffect(() => {
    localStorage.setItem('leadgenius_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const saved = localStorage.getItem('savedLeadSearches');
    if (saved) setSavedSearches(JSON.parse(saved));

    const favs = localStorage.getItem('favorite_searches');
    if (favs) setFavoriteSearches(JSON.parse(favs));
    
    // Load History
    const history = localStorage.getItem('search_history');
    if (history) setSearchHistory(JSON.parse(history));

    const lastUser = localStorage.getItem('leadgenius_last_user');
    if (lastUser) handleLogin(lastUser);

    const savedLeads = localStorage.getItem('current_leads');
    const savedQuery = localStorage.getItem('current_query');
    if (savedLeads && savedQuery) {
      setLeads(JSON.parse(savedLeads));
      setSearchState(s => ({ ...s, query: savedQuery }));
      toast.success('Session restored');
    }
  }, []);

  useEffect(() => {
    if (leads.length > 0) {
      localStorage.setItem('current_leads', JSON.stringify(leads));
      localStorage.setItem('current_query', searchState.query);
    }
  }, [leads, searchState.query]);

  useEffect(() => {
    localStorage.setItem('leadgenius_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (searchState.query && !searchState.isSearching && leads.length > 0) {
      try {
        const historyJSON = localStorage.getItem('search_history');
        const history = historyJSON ? JSON.parse(historyJSON) : [];
        const newEntry = { 
          query: searchState.query, 
          count: leads.length, 
          date: new Date().toISOString() 
        };
        const filtered = history.filter((h: any) => h.query !== newEntry.query);
        const updated = [newEntry, ...filtered].slice(0, 50);
        localStorage.setItem('search_history', JSON.stringify(updated));
        setSearchHistory(updated); // Update state immediately
      } catch (e) {
        console.error("Failed to save history", e);
      }
    }
  }, [searchState.isSearching, leads.length, searchState.query]);

  useEffect(() => {
    if (!user?.email) return;
    const email = user.email;
    const interval = setInterval(async () => {
      try {
        const updated = await authService.getUser(email);
        setUser(prev => prev?.email === updated.email ? updated : prev);
      } catch (err) { }
    }, 5000);
    return () => clearInterval(interval);
  }, [user?.email]);

  const handleLogin = async (email: string) => {
    const profile = await authService.login(email);
    setUser(profile);
    setTransactions(authService.getTransactions(email));
    localStorage.setItem('leadgenius_last_user', email);
    toast.success(`Welcome back, ${profile.name?.split(' ')[0] || 'User'}!`);
  };

  const handleLogout = () => {
    setUser(null); setLeads([]);
    localStorage.clear();
    toast('Logged out');
  };

  const handlePurchase = async (amount: number, plan: string) => {
    if (!user) return;
    const updatedUser = await authService.addCredits(user.email, amount, plan as any);
    setUser(updatedUser);
    setTransactions(authService.getTransactions(user.email));
    toast.success(`+${amount.toLocaleString()} credits added!`);
  };

  const handleToggleSelect = (id: number) => {
    const newSet = new Set(selectedLeadIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedLeadIds(newSet);
  };

  const handleSelectAll = (ids: number[]) => {
    const newSet = new Set(selectedLeadIds);
    ids.forEach(id => newSet.add(id));
    setSelectedLeadIds(newSet);
  };

  const handleStatusChange = (id: number, newStatus: LeadStatus) => {
    let updatedLead: Lead | undefined;
    setLeads(prev => prev.map(l => {
      if (l.id === id) {
        updatedLead = { ...l, status: newStatus };
        return updatedLead;
      }
      return l;
    }));
    const formattedStatus = newStatus.charAt(0).toUpperCase() + newStatus.slice(1);
    toast.success(`Lead moved to ${formattedStatus}`, { 
      icon: '✅',
      style: { background: '#1e293b', color: '#fff' } 
    });

    if (updatedLead && settings.webhookUrl) {
      fetch(settings.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'lead_status_change',
          lead: updatedLead,
          timestamp: new Date().toISOString()
        })
      })
      .then(() => toast.success("Webhook Triggered", { icon: '🔌' }))
      .catch((e) => console.error("Webhook failed", e));
    }
  };

  const saveAsFavorite = async () => {
    if (!searchState.query || leads.length === 0) return;
    const toastId = toast.loading('Capturing dashboard...');
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      let thumbnail = 'https://via.placeholder.com/300x200?text=No+Preview';
      if (dashboardElement) {
        try {
          const canvas = await html2canvas(dashboardElement, {
            scale: 0.5,
            useCORS: true,
            logging: false,
            backgroundColor: document.documentElement.classList.contains('dark') ? '#0f172a' : '#f8fafc',
            height: 600, 
            windowWidth: 1200
          });
          thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        } catch (e) {
          console.error("Thumbnail generation failed:", e);
        }
      }
      const newFav = {
        query: searchState.query,
        leadsCount: leads.length,
        timestamp: Date.now(),
        thumbnail
      };
      const updated = [...favoriteSearches, newFav].slice(-10);
      setFavoriteSearches(updated);
      localStorage.setItem('favorite_searches', JSON.stringify(updated));
      toast.success('Saved to favorites!', { id: toastId });
    } catch (err) {
      toast.error('Failed to save search', { id: toastId });
    }
  };

  const handleSelectHistory = (query: string) => {
    setSearchState(s => ({ ...s, query }));
    setShowHistory(false);
  };

  const clearHistory = () => {
    localStorage.removeItem('search_history');
    setSearchHistory([]);
    toast.success("Search history cleared");
    setShowHistory(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowHistory(false); // Close dropdown on submit
    if (!searchState.query.trim() || !userRef.current) return;

    const controller = new AbortController();
    setAbortController(controller);
    setSearchState(s => ({ ...s, isSearching: true, progressStep: 1, error: null, batchesCompleted: 0, totalLeads: 0 }));
    // We do NOT clear leads here immediately to prevent flicker if user is adding more, 
    // BUT user expects new search. Let's clear if query changed or user explicitly reset.
    // For now, consistent with UI, we clear.
    setLeads([]);
    setSelectedLeadIds(new Set()); 

    let fullQuery = searchState.query;
    const constraints: string[] = [];
    if (filters.location.trim()) constraints.push(`Location: ${filters.location.trim()}`);
    if (filters.industry && filters.industry !== 'Other') constraints.push(`Industry: ${filters.industry}`);
    if (filters.employees.trim()) constraints.push(`Company Size: ${filters.employees.trim()}`);

    if (constraints.length > 0) {
      fullQuery += ` (Strict Constraints: ${constraints.join(', ')})`;
    }

    try {
      let currentLeads: Lead[] = [];
      let consecutiveEmptyBatches = 0;

      for (let i = 0; i < MAX_BATCHES; i++) {
        if (controller.signal.aborted) break;
        const freshUser = userRef.current;
        if (!freshUser || freshUser.credits < 1) {
          toast.error('Not enough credits!');
          setShowPricing(true);
          break;
        }

        const existing = currentLeads.map(l => l.company);
        const batch = await generateLeadsBatch(fullQuery, BATCH_SIZE, i, existing);
        if (controller.signal.aborted) break;

        // Even if batch is empty, we update progress
        setSearchState(s => ({ ...s, batchesCompleted: i + 1 }));

        if (batch.length === 0) {
          consecutiveEmptyBatches++;
          if (consecutiveEmptyBatches >= 3) {
             toast('Search complete. No new leads found.', { icon: '✅' });
             break;
          }
          await new Promise(r => setTimeout(r, 500));
          continue;
        }

        const enriched: Lead[] = [];
        for (const lead of batch) {
           if (controller.signal.aborted) break;
           const enrichedLead = await enrichWithApollo(lead);
           enriched.push(enrichedLead);
           await new Promise(r => setTimeout(r, 50)); // Tiny delay for UI responsiveness
        }
        if (controller.signal.aborted) break;

        const scored = enriched.map(l => ({ 
          ...l, 
          score: calculateLeadScore(l),
          status: 'new' as LeadStatus 
        }));

        const unique = scored.filter(l => !existing.some(e => e.toLowerCase() === l.company.toLowerCase()));
        
        if (unique.length > 0) {
          consecutiveEmptyBatches = 0; 
          await authService.deductCredits(freshUser.email, unique.length, `Search: ${searchState.query}`);
          setUser(await authService.getUser(freshUser.email)); 
          
          currentLeads = [...currentLeads, ...unique];
          setLeads(prev => [...prev, ...unique]);
          setSearchState(s => ({ ...s, totalLeads: currentLeads.length }));
        } else {
           consecutiveEmptyBatches++;
        }
        
        await new Promise(r => setTimeout(r, 500)); 
      }
    } catch (err: any) {
      if (!controller.signal.aborted) toast.error(err.message || 'Search failed');
    } finally {
      setSearchState(s => ({ ...s, isSearching: false }));
      setAbortController(null);
    }
  };

  const handleStopMining = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      toast('Mining stopped by user', { icon: '🛑' });
    }
  };

  const handleAddLookalikes = (newLeads: Lead[]) => {
    setLeads(prev => [...prev, ...newLeads]);
    setViewMode(ViewMode.LIST);
  };

  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <div className="relative z-10">
           <AuthModal onLogin={handleLogin} />
        </div>
        {/* Ambient background for auth screen */}
        <div className="fixed inset-0 z-0 bg-slate-900 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-900/30 rounded-full blur-[120px] animate-blob"></div>
          <div className="absolute top-[40%] right-[-10%] w-[40%] h-[40%] bg-indigo-900/30 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-slate-800/50 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
        </div>
      </>
    );
  }

  const selectedLeadsList = leads.filter(l => selectedLeadIds.has(l.id));

  return (
    <div className="flex h-screen overflow-hidden font-sans relative">
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

      {/* Ambient Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-100/40 dark:bg-slate-800/30 rounded-full blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      {/* Modals */}
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} onPurchase={handlePurchase} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} settings={settings} onSave={setSettings}/>
      {selectedLead && (<EmailSequenceModal lead={selectedLead} isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} brandVoice={settings.brandVoice}/>)}
      <WhatsAppCampaignModal leads={selectedLeadsList} isOpen={showWhatsAppModal} onClose={() => setShowWhatsAppModal(false)} brandVoice={settings.brandVoice}/>
      <SMSCampaignModal leads={selectedLeadsList} isOpen={showSMSModal} onClose={() => setShowSMSModal(false)} brandVoice={settings.brandVoice}/>
      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} leads={leads} query={searchState.query} />

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden animate-fade-in"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Glass Sidebar (Responsive) */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 w-72 flex flex-col z-40 glass border-r border-slate-200/50 dark:border-white/5 
        transition-transform duration-300 md:translate-x-0
        ${showMobileMenu ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center px-6 border-b border-slate-200/50 dark:border-white/5 justify-between">
          <div className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              LeadGenius
            </span>
          </div>
          <button onClick={() => setShowMobileMenu(false)} className="md:hidden text-slate-500 hover:text-slate-800 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          {/* Credits Card */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                 <p className="text-indigo-100 text-xs font-semibold uppercase tracking-wider">Credits</p>
                 <CreditCard className="w-4 h-4 text-indigo-200" />
              </div>
              <p className="text-3xl font-bold tracking-tight">{user.credits.toLocaleString()}</p>
              <button 
                onClick={() => { setShowPricing(true); setShowMobileMenu(false); }} 
                className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-xs font-bold transition-colors border border-white/10"
              >
                Upgrade Plan
              </button>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Discover</p>
            {[
              { id: ViewMode.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
              { id: ViewMode.LIST, label: 'All Leads', icon: List },
              { id: ViewMode.MAP, label: 'Global Map', icon: Map },
              { id: ViewMode.PIPELINE, label: 'Pipeline', icon: Kanban },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => { setViewMode(item.id); setShowMobileMenu(false); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  viewMode === item.id 
                    ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-4 h-4 ${viewMode === item.id ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
            
            <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 mt-6">Growth Tools</p>
             {[
              { id: ViewMode.LOOKALIKE, label: 'Lookalike Finder', icon: Users },
              { id: ViewMode.COMPETITORS, label: 'Competitor Spy', icon: Target },
              { id: ViewMode.EMAIL_WARMUP, label: 'Email Warmup', icon: ShieldCheck },
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => { setViewMode(item.id); setShowMobileMenu(false); }} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  viewMode === item.id 
                    ? 'bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <item.icon className={`w-4 h-4 ${viewMode === item.id ? 'text-purple-600 dark:text-purple-300' : 'text-slate-400'}`} />
                {item.label}
              </button>
            ))}
          </div>
          
           {/* Favorites Mini List */}
          {favoriteSearches.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-200/50 dark:border-white/5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">Saved</h3>
              <div className="space-y-2">
                {favoriteSearches.slice(-3).reverse().map((f, i) => (
                  <div key={i} onClick={() => { setSearchState(s => ({ ...s, query: f.query })); setShowMobileMenu(false); }} className="cursor-pointer group px-2 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                     <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-300 dark:border-slate-600">
                       <img src={f.thumbnail} alt="" className="w-full h-full object-cover opacity-80" />
                     </div>
                     <div className="min-w-0">
                       <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{f.query}</div>
                       <div className="text-[10px] text-slate-500">{f.leadsCount} leads</div>
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200/50 dark:border-white/5 space-y-2">
          <button onClick={() => { setShowSettingsModal(true); setShowMobileMenu(false); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <SettingsIcon className="w-4 h-4" /> Settings
          </button>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden">
        
        {/* Floating Header */}
        <header className="h-20 px-4 md:px-8 flex items-center justify-between glass z-20 border-b border-slate-200/50 dark:border-white/5">
          <div className="flex items-center gap-3">
             <button onClick={() => setShowMobileMenu(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg">
                <Menu className="w-6 h-6" />
             </button>

             <div className="flex flex-col">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {viewMode === ViewMode.DASHBOARD ? 'Dashboard' 
                    : viewMode === ViewMode.MAP ? 'Global Intelligence' 
                    : viewMode === ViewMode.PIPELINE ? 'CRM Pipeline' 
                    : viewMode === ViewMode.COMPETITORS ? 'Market Spy'
                    : viewMode === ViewMode.EMAIL_WARMUP ? 'Reputation'
                    : viewMode === ViewMode.LOOKALIKE ? 'Lookalike AI'
                    : 'Lead Database'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                   {leads.length > 0 ? `${leads.length} Active Leads` : 'Ready to scale'}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
             {/* Action Bar */}
             {selectedLeadIds.size > 0 && (
              <div className="flex gap-1 md:gap-2 mr-2 md:mr-4 animate-fade-in bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <button onClick={() => setShowWhatsAppModal(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="WhatsApp Broadcast">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                </button>
                <button onClick={() => setShowSMSModal(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors" title="Send SMS">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                </button>
              </div>
            )}

            {/* Always show export if leads exist, even if none selected */}
            {leads.length > 0 && viewMode !== ViewMode.COMPETITORS && viewMode !== ViewMode.EMAIL_WARMUP && viewMode !== ViewMode.LOOKALIKE && (
               <div className="flex gap-1 md:gap-2">
                 <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-600/20 rounded-lg text-xs font-bold transition-colors">
                   <FileSpreadsheet className="w-3.5 h-3.5" /> <span className="hidden md:inline">Export</span>
                 </button>
                 <button onClick={saveAsFavorite} className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 hover:shadow-indigo-500/40 transition-all">
                   <Star className="w-3.5 h-3.5" /> Save
                 </button>
               </div>
            )}
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

            <button onClick={() => setDarkMode(!darkMode)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg text-slate-500 dark:text-slate-400 transition-colors">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          
           {/* Dynamic View Rendering */}
           {viewMode === ViewMode.COMPETITORS ? (
              <CompetitorScanner />
           ) : viewMode === ViewMode.EMAIL_WARMUP ? (
              <EmailWarmup />
           ) : viewMode === ViewMode.LOOKALIKE ? (
              <LookalikeFinder onAddLeads={handleAddLookalikes} />
           ) : (
            <>
               {/* Search Hero Section */}
               <div className="pt-6 md:pt-8 px-4 md:px-8 pb-4 z-10">
                 <form onSubmit={handleSearch} className="max-w-4xl mx-auto relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative flex flex-col md:flex-row bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 ring-1 ring-slate-900/5 dark:ring-white/10 z-20">
                        
                        <div className="flex-1 flex items-center px-4 py-2 relative">
                           <Search className="w-5 h-5 text-slate-400 ml-2" />
                           <input
                              type="text"
                              value={searchState.query}
                              onChange={e => setSearchState(s => ({ ...s, query: e.target.value }))}
                              onFocus={() => setShowHistory(true)}
                              onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                              placeholder="Describe your target (e.g. 'Fintech in London')"
                              className="w-full py-3 md:py-4 px-2 md:px-4 bg-transparent border-none focus:ring-0 text-base md:text-lg placeholder:text-slate-400 text-slate-900 dark:text-white font-medium"
                           />
                           
                           {/* Search History Dropdown */}
                           {showHistory && searchHistory.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-700/50 text-xs font-bold text-slate-400 uppercase tracking-wider flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                    <span className="px-2">Recent Searches</span>
                                    <button onMouseDown={(e) => { e.preventDefault(); clearHistory(); }} className="text-red-500 hover:text-red-600 px-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">Clear History</button>
                                </div>
                                <div className="max-h-60 overflow-y-auto">
                                  {searchHistory.map((h, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onMouseDown={(e) => { e.preventDefault(); handleSelectHistory(h.query); }}
                                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex items-center justify-between group transition-colors border-b border-slate-50 dark:border-slate-700/50 last:border-0"
                                    >
                                      <div className="flex items-center gap-3">
                                        <History className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">{h.query}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                                        <span className="text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full font-bold">
                                            {h.count} leads
                                        </span>
                                      </div>
                                    </button>
                                  ))}
                                </div>
                              </div>
                           )}
                        </div>

                        <div className="flex items-center gap-2 p-2 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700/50">
                           <button
                              type="button"
                              onClick={() => setShowFilters(!showFilters)}
                              className={`px-3 md:px-4 py-3 rounded-xl flex items-center gap-2 transition-all font-medium text-sm ${showFilters ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                           >
                              <Filter className="w-4 h-4" />
                              <span className="hidden sm:inline">Filters</span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                           </button>

                           {searchState.isSearching ? (
                              <button
                                type="button"
                                onClick={handleStopMining}
                                className="px-4 md:px-6 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-600 border border-red-500/20 rounded-xl font-bold flex items-center gap-2 transition-all"
                              >
                                <Ban className="w-4 h-4" /> Stop
                              </button>
                           ) : (
                              <button
                                type="submit"
                                disabled={!searchState.query.trim()}
                                className="px-6 md:px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg hover:shadow-indigo-500/30 transform hover:scale-[1.02]"
                              >
                                <Zap className="w-4 h-4 fill-white" />
                                <span className="hidden sm:inline">Find Leads</span>
                                <span className="sm:hidden">Go</span>
                              </button>
                           )}
                        </div>
                    </div>

                    {/* Filter Drawer */}
                    {showFilters && (
                        <div className="mt-4 p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl animate-fade-in z-10 relative">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Location</label>
                              <div className="relative">
                                <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input 
                                  type="text" 
                                  value={filters.location}
                                  onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
                                  placeholder="City, Country"
                                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                />
                              </div>
                            </div>
                            <div>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Industry</label>
                               <div className="relative">
                                 <Building className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                 <select 
                                    value={filters.industry}
                                    onChange={(e) => setFilters(f => ({ ...f, industry: e.target.value }))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-sm transition-all"
                                  >
                                    <option value="">Any Industry</option>
                                    {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                  </select>
                               </div>
                            </div>
                             <div>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Size</label>
                               <div className="relative">
                                 <Users className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                 <input 
                                    type="text" 
                                    value={filters.employees}
                                    onChange={(e) => setFilters(f => ({ ...f, employees: e.target.value }))}
                                    placeholder="e.g. 11-50 employees"
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                                  />
                               </div>
                            </div>
                          </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {searchState.isSearching && (
                      <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-lg animate-fade-in relative overflow-hidden z-10">
                         {/* Shimmer Effect */}
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>

                         <div className="flex justify-between items-center mb-2 relative z-10">
                            <div className="flex items-center gap-2">
                               <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-md">
                                 <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                               </div>
                               <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                  Mining Leads...
                                </span>
                            </div>
                            <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                               {Math.round((searchState.batchesCompleted / MAX_BATCHES) * 100)}%
                            </span>
                         </div>
                         
                         <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden relative z-10">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out"
                              style={{ width: `${(searchState.batchesCompleted / MAX_BATCHES) * 100}%` }}
                            />
                         </div>
                         
                         <div className="mt-2 flex justify-between text-[11px] font-medium text-slate-400 relative z-10">
                            <span>Scanning Batch {searchState.batchesCompleted} of {MAX_BATCHES}</span>
                            <span className="text-indigo-600 dark:text-indigo-400">{leads.length} leads found so far</span>
                         </div>
                      </div>
                    )}
                 </form>
               </div>

               {/* Results Area */}
               <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 pt-4" id="dashboard-content">
                 {searchState.isSearching && leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full animate-fade-in">
                       <div className="relative">
                          <div className="w-20 h-20 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
                          <div className="w-20 h-20 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                       </div>
                       <h3 className="mt-8 text-xl font-bold text-slate-900 dark:text-white">AI Agent Active</h3>
                       <p className="text-slate-500 dark:text-slate-400 mt-2">Scanning industry databases and verifying contacts...</p>
                    </div>
                 ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
                        <div className="relative w-64 h-48 mb-8 group cursor-pointer" onClick={() => document.querySelector('input')?.focus()}>
                            {/* Decorative Thumbnail/Illustration */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl opacity-20 group-hover:opacity-30 blur-xl transition-all"></div>
                            <div className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-6 flex flex-col items-center justify-center h-full transform group-hover:scale-105 transition-transform duration-300">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded-full mb-2"></div>
                                <div className="h-2 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ready to Prospect</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                          Enter your target market above to generate high-quality B2B leads using Gemini AI.
                        </p>
                    </div>
                 ) : (
                    <div className="animate-fade-in h-full">
                       {viewMode === ViewMode.DASHBOARD && <Dashboard leads={leads} />}
                       {viewMode === ViewMode.LIST && (
                          <LeadTable 
                             leads={leads} 
                             selectedIds={selectedLeadIds} 
                             onToggleSelect={handleToggleSelect} 
                             onSelectAll={handleSelectAll}
                             onStatusChange={handleStatusChange}
                             onOpenEmail={(lead) => setSelectedLead(lead)}
                          />
                       )}
                       {viewMode === ViewMode.MAP && <MapView leads={leads} />}
                       {viewMode === ViewMode.PIPELINE && (
                          <PipelineBoard leads={leads} onStatusChange={handleStatusChange} />
                       )}
                    </div>
                 )}
               </div>
            </>
           )}
        </div>
      </main>
    </div>
  );
}
