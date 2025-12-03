
import React, { useState, useEffect, useRef } from 'react';
import { ViewMode, Lead, SearchState, UserProfile, Transaction } from './types';
import { generateLeadsBatch } from './services/geminiService';
import { enrichWithApollo } from './services/apolloService';
import { authService } from './services/authService';
import Dashboard from './components/Dashboard';
import LeadTable from './components/LeadTable';
import EmailSequenceModal from './components/EmailSequenceModal';
import { AuthModal } from './components/AuthModal';
import { PricingModal } from './components/PricingModal';
import { TermsModal, PrivacyModal } from './components/LegalModals';
import { exportDashboardToPDF } from './utils/exportPDF';
import { exportToHubSpot, exportToSalesforce } from './utils/exportCRM';
import { exportToCSV } from './utils/exportCSV';
import { calculateLeadScore } from './utils/leadScore';
import toast, { Toaster } from 'react-hot-toast';
import {
  Download, Moon, Sun, Search, LayoutDashboard, List, Database, Zap,
  CreditCard, LogOut, Star, Upload, Loader2, Filter, FileSpreadsheet, Ban
} from 'lucide-react';

const BATCH_SIZE = 5;
const MAX_BATCHES = 100;

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [darkMode, setDarkMode] = useState(true);
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
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [favoriteSearches, setFavoriteSearches] = useState<any[]>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Modals
  const [showPricing, setShowPricing] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const userRef = useRef<UserProfile | null>(null);
  userRef.current = user;

  // Dark Mode
  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedLeadSearches');
    if (saved) setSavedSearches(JSON.parse(saved));

    const favs = localStorage.getItem('favorite_searches');
    if (favs) setFavoriteSearches(JSON.parse(favs));

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

  // Save leads
  useEffect(() => {
    if (leads.length > 0) {
      localStorage.setItem('current_leads', JSON.stringify(leads));
      localStorage.setItem('current_query', searchState.query);
    }
  }, [leads, searchState.query]);

  // Real-time credit sync
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      try {
        const updated = await authService.getUser(user.email);
        setUser(updated);
      } catch (err) { }
    }, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Auth
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

  // Save as favorite with thumbnail
  const saveAsFavorite = async () => {
    if (!searchState.query || leads.length === 0) return;
    
    // We'll just save the metadata for now since html2canvas is heavy to run repeatedly
    const newFav = {
      query: searchState.query,
      leadsCount: leads.length,
      timestamp: Date.now(),
      thumbnail: 'https://via.placeholder.com/300x200?text=Saved+Search' // Placeholder until exportPDF is used
    };

    const updated = [...favoriteSearches, newFav].slice(-10);
    setFavoriteSearches(updated);
    localStorage.setItem('favorite_searches', JSON.stringify(updated));
    toast.success('Saved to favorites!');
  };

  // Search with Apollo enrichment + scoring
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchState.query.trim() || !userRef.current) return;

    const controller = new AbortController();
    setAbortController(controller);
    setSearchState(s => ({ ...s, isSearching: true, progressStep: 1, error: null, batchesCompleted: 0, totalLeads: 0 }));
    setLeads([]);

    try {
      let currentLeads: Lead[] = [];

      for (let i = 0; i < MAX_BATCHES; i++) {
        if (controller.signal.aborted) break;

        const freshUser = userRef.current;
        if (!freshUser || freshUser.credits < BATCH_SIZE) {
          toast.error('Not enough credits!');
          setShowPricing(true);
          break;
        }

        // Deduct upfront
        await authService.deductCredits(freshUser.email, BATCH_SIZE, `Search: ${searchState.query}`);
        setUser(await authService.getUser(freshUser.email));

        const existing = currentLeads.map(l => l.company);
        const batch = await generateLeadsBatch(searchState.query, BATCH_SIZE, i, existing);
        const enriched = await Promise.all(batch.map(enrichWithApollo));
        const scored = enriched.map(l => ({ ...l, score: calculateLeadScore(l) }));

        const unique = scored.filter(l => !existing.some(e => e.toLowerCase() === l.company.toLowerCase()));
        if (unique.length > 0) {
          setLeads(prev => {
            currentLeads = [...prev, ...unique];
            return currentLeads;
          });
          setSearchState(s => ({ ...s, batchesCompleted: i + 1, totalLeads: currentLeads.length }));
        }

        if (unique.length < BATCH_SIZE) {
          toast.success(`Found all available leads: ${currentLeads.length}`);
          break;
        }

        await new Promise(r => setTimeout(r, 1000));
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

  if (!user) {
    return (
      <>
        <Toaster position="top-center" />
        <AuthModal onLogin={handleLogin} />
      </>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-inter">
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />

      {/* Modals */}
      <PricingModal isOpen={showPricing} onClose={() => setShowPricing(false)} onPurchase={handlePurchase} />
      <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal isOpen={showPrivacy} onClose={() => setShowPrivacy(false)} />
      {selectedLead && <EmailSequenceModal lead={selectedLead} isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} />}

      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-indigo-600" />
            <span className="text-2xl font-bold tracking-tight">LeadGenius</span>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {/* Credits */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-indigo-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Available Credits</p>
                <p className="text-3xl font-bold mt-1">{user.credits.toLocaleString()}</p>
              </div>
              <button onClick={() => setShowPricing(true)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
                <CreditCard className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* View Mode */}
          <div className="space-y-2 mb-8">
            <button onClick={() => setViewMode(ViewMode.DASHBOARD)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === ViewMode.DASHBOARD ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <LayoutDashboard className="w-5 h-5" /> Dashboard
            </button>
            <button onClick={() => setViewMode(ViewMode.LIST)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${viewMode === ViewMode.LIST ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              <List className="w-5 h-5" /> All Leads
            </button>
          </div>

          {/* Favorites */}
          {favoriteSearches.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Recent Searches</h3>
              {favoriteSearches.slice(-3).reverse().map((f, i) => (
                <div key={i} onClick={() => setSearchState(s => ({ ...s, query: f.query }))} className="cursor-pointer group px-2">
                   <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">{f.query}</div>
                   <div className="text-xs text-slate-500">{f.leadsCount} leads found</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <button onClick={saveAsFavorite} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium text-sm transition-colors">
            <Star className="w-4 h-4" /> Save Search
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium text-sm transition-colors">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col relative z-0">
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-8 shadow-sm z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            {viewMode === ViewMode.DASHBOARD ? 'Dashboard' : 'Lead Database'} 
            {leads.length > 0 && <span className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full">{leads.length}</span>}
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-500 dark:text-slate-400">
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
            {leads.length > 0 && (
              <>
                 <button onClick={() => exportToCSV(leads, searchState.query)} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                  <FileSpreadsheet className="w-4 h-4" /> CSV
                </button>
                <button onClick={exportDashboardToPDF} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors">
                  <Download className="w-4 h-4" /> Report
                </button>
                <div className="flex bg-indigo-600 rounded-lg p-0.5">
                    <button onClick={() => exportToHubSpot(leads)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors">
                    HubSpot
                    </button>
                    <div className="w-px bg-indigo-500 my-1"></div>
                    <button onClick={() => exportToSalesforce(leads)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors">
                    Salesforce
                    </button>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Search Bar */}
        <div className="p-8 pb-4">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="relative group z-20">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative flex bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-xl ring-1 ring-slate-900/5">
                  <div className="flex-1 flex items-center pl-4 gap-3">
                    <Search className="w-6 h-6 text-slate-400" />
                    <input
                        type="text"
                        value={searchState.query}
                        onChange={e => setSearchState(s => ({ ...s, query: e.target.value }))}
                        placeholder="Describe your ideal customer (e.g., 'SaaS startups in Toronto with >50 employees')"
                        className="w-full py-3 bg-transparent border-none focus:ring-0 text-lg placeholder:text-slate-400 text-slate-900 dark:text-white"
                    />
                  </div>
                  {searchState.isSearching ? (
                     <button
                        type="button"
                        onClick={handleStopMining}
                        className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold flex items-center gap-2 transition-all animate-pulse"
                      >
                        <Ban className="w-5 h-5" />
                        Stop Mining
                      </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!searchState.query.trim()}
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white rounded-xl font-semibold flex items-center gap-2 transition-all"
                    >
                      <Database className="w-5 h-5" />
                      Find Leads
                    </button>
                  )}
              </div>
            </div>

            {searchState.isSearching && (
              <div className="mt-6 max-w-2xl mx-auto text-center space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <span>Progress</span>
                  <span>{Math.round((searchState.batchesCompleted / MAX_BATCHES) * 100)}%</span>
                </div>
                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-500 ease-out"
                    style={{ width: `${(searchState.batchesCompleted / MAX_BATCHES) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-slate-500 animate-pulse">
                  AI Agent is searching verified sources... ({searchState.totalLeads} leads found)
                </p>
              </div>
            )}
          </form>
        </div>

        {/* Content */}
        <div id="dashboard-content" className="flex-1 overflow-y-auto px-8 pb-8 scroll-smooth">
          {viewMode === ViewMode.DASHBOARD ? (
            <Dashboard leads={leads} />
          ) : (
            <LeadTable leads={leads} />
          )}
          
          {leads.length === 0 && !searchState.isSearching && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 -mt-20">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                      <Filter className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No leads generated yet</h3>
                  <p className="max-w-md text-center mt-2">Enter a target audience above to start the AI mining process. We use live Google Search grounding to verify every lead.</p>
              </div>
          )}
        </div>
      </main>
    </div>
  );
}
