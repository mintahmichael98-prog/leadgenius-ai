
import React, { useState } from 'react';
import { Search, Loader2, Globe, Target, TrendingUp, TrendingDown, ArrowRight, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import { analyzeCompetitors } from '../services/geminiService';
import { CompetitorAnalysis } from '../types';
import toast from 'react-hot-toast';

export default function CompetitorScanner() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CompetitorAnalysis | null>(null);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setData(null);
    try {
      const result = await analyzeCompetitors(url);
      setData(result);
      if (result) toast.success(`Found ${result.competitors.length} competitors!`);
    } catch (err: any) {
      toast.error("Analysis failed. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const ensureUrl = (link?: string) => {
    if (!link || link === 'N/A') return '#';
    return link.startsWith('http') ? link : `https://${link}`;
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-2">
            <Target className="w-8 h-8 text-rose-600 dark:text-rose-400" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Competitor Spy</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Enter a website URL to instantly uncover direct competitors, analyze their strengths, and find gaps in the market.
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleScan} className="relative max-w-2xl mx-auto w-full">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Globe className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="e.g. stripe.com or airbnb.com"
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none shadow-sm text-lg"
          />
          <button
            type="submit"
            disabled={loading || !url}
            className="absolute right-2 top-2 bottom-2 px-6 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Scan Market <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        {/* Results */}
        {data && (
          <div className="space-y-8 animate-fade-in-up">
            {/* Target Card */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center text-xl font-bold text-slate-700 dark:text-slate-300 uppercase">
                  {data.target.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.target.name}</h3>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">
                    {data.target.industry}
                  </span>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{data.target.summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.competitors.map((comp, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-slate-100 to-transparent dark:from-slate-700/50 -mr-8 -mt-8 rounded-full"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white truncate pr-4">{comp.name}</h4>
                    <div className="flex items-center gap-2">
                      {comp.socials?.linkedin && (
                        <a href={ensureUrl(comp.socials.linkedin)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#0077b5] transition-colors" title="LinkedIn">
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      {comp.socials?.twitter && (
                        <a href={ensureUrl(comp.socials.twitter)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1DA1F2] transition-colors" title="Twitter">
                          <Twitter className="w-4 h-4" />
                        </a>
                      )}
                      {comp.socials?.instagram && (
                        <a href={ensureUrl(comp.socials.instagram)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#E4405F] transition-colors" title="Instagram">
                          <Instagram className="w-4 h-4" />
                        </a>
                      )}
                      {comp.socials?.facebook && (
                         <a href={ensureUrl(comp.socials.facebook)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#1877F2] transition-colors" title="Facebook">
                          <Facebook className="w-4 h-4" />
                        </a>
                      )}
                      {comp.website && (
                         <a href={ensureUrl(comp.website)} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-rose-500 transition-colors" title="Website">
                          <ExternalLinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 h-10 line-clamp-2">
                    {comp.description}
                  </p>

                  <div className="space-y-3 mt-auto">
                    <div className="flex gap-3">
                      <div className="mt-1">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Strength</span>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{comp.strength}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                       <div className="mt-1">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Weakness</span>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{comp.weakness}</p>
                      </div>
                    </div>
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

const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);
