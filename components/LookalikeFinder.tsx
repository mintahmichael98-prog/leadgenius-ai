
import React, { useState } from 'react';
import { Search, Loader2, ArrowRight, Target, Plus, Users, Globe } from 'lucide-react';
import { findLookalikes } from '../services/geminiService';
import { Lead } from '../types';
import toast from 'react-hot-toast';

interface Props {
  onAddLeads: (leads: Lead[]) => void;
}

export default function LookalikeFinder({ onAddLeads }: Props) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Lead[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setResults([]);
    
    try {
      const leads = await findLookalikes(url);
      setResults(leads);
      if (leads.length > 0) toast.success(`Found ${leads.length} lookalike companies!`);
      else toast.error("No results found. Try a different URL.");
    } catch (e: any) {
      toast.error(e.message || "Search failed");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    onAddLeads(results);
    toast.success(`Imported ${results.length} leads to your database`);
    setResults([]);
    setUrl('');
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-2">
            <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Lookalike Audience Finder</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Input a website, and our AI will find 20 other companies with matching business models, tech stacks, and customer bases.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Globe className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. airbnb.com"
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none shadow-sm text-lg"
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="absolute right-2 top-2 bottom-2 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Find Lookalikes <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Found {results.length} Companies similar to {url}
              </h3>
              <button 
                onClick={handleImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Import All to Leads
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((lead) => (
                <div key={lead.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{lead.company}</h4>
                    <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      {lead.industry}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3 flex-1">
                    {lead.description}
                  </p>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                    <span>{lead.location}</span>
                    <a href={lead.website} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline">
                      Visit Website
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
