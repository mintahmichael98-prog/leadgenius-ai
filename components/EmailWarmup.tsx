
import React, { useState, useEffect } from 'react';
import { ShieldCheck, Mail, Activity, BarChart3, Play, Pause, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip } from 'recharts';
import toast from 'react-hot-toast';

export default function EmailWarmup() {
  const [email, setEmail] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [warmingUp, setWarmingUp] = useState(false);
  const [stats, setStats] = useState({ score: 0, sent: 0, landed: 0, spam: 0 });
  const [history, setHistory] = useState<any[]>([]);
  const [checks, setChecks] = useState({ spf: false, dkim: false, dmarc: false, blacklist: false });

  // Simulate Warmup Progress
  useEffect(() => {
    let interval: any;
    if (warmingUp) {
      interval = setInterval(() => {
        setStats(prev => {
          const newSent = prev.sent + Math.floor(Math.random() * 3) + 1;
          const isSpam = Math.random() > 0.95;
          return {
            ...prev,
            sent: newSent,
            landed: isSpam ? prev.landed : prev.landed + 1,
            spam: isSpam ? prev.spam + 1 : prev.spam
          };
        });
        
        // Update Chart Data
        setHistory(prev => {
            const last = prev[prev.length - 1];
            const now = new Date();
            const timeLabel = `${now.getHours()}:${now.getMinutes() < 10 ? '0' : ''}${now.getMinutes()}`;
            
            if (last && last.time === timeLabel) {
                 const updated = [...prev];
                 updated[updated.length - 1].emails += 1;
                 return updated;
            }
            return [...prev.slice(-10), { time: timeLabel, emails: 1 }];
        });

      }, 2000);
    }
    return () => clearInterval(interval);
  }, [warmingUp]);

  const handleAnalyze = async () => {
    if (!email) return;
    setAnalyzing(true);
    setChecks({ spf: false, dkim: false, dmarc: false, blacklist: false });
    
    // Simulate Analysis Steps
    await new Promise(r => setTimeout(r, 800));
    setChecks(p => ({ ...p, spf: true }));
    await new Promise(r => setTimeout(r, 600));
    setChecks(p => ({ ...p, dkim: true }));
    await new Promise(r => setTimeout(r, 700));
    setChecks(p => ({ ...p, dmarc: true }));
    await new Promise(r => setTimeout(r, 900));
    setChecks(p => ({ ...p, blacklist: true }));
    
    setStats(s => ({ ...s, score: 94 }));
    setAnalyzing(false);
    toast.success("Domain reputation analysis complete");
  };

  const toggleWarmup = () => {
    setWarmingUp(!warmingUp);
    if (!warmingUp) toast.success("Warmup sequence started");
    else toast("Warmup paused");
  };

  return (
    <div className="h-full p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-500" /> Email Warmup & Reputation
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Ensure your emails land in the primary inbox, not spam.
            </p>
          </div>
          
          <div className="flex gap-2">
            <input 
               type="email" 
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder="sender@domain.com"
               className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 w-64 outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button 
              onClick={handleAnalyze}
              disabled={analyzing || !email}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />} Analyze
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full -mr-12 -mt-12"></div>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Reputation Score</p>
             <div className="flex items-end gap-2">
               <span className="text-4xl font-bold text-slate-900 dark:text-white">{stats.score}</span>
               <span className="text-sm text-emerald-500 font-medium mb-1">/ 100</span>
             </div>
           </div>

           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Emails Sent</p>
             <span className="text-3xl font-bold text-slate-900 dark:text-white">{stats.sent}</span>
           </div>

           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Landed in Inbox</p>
             <span className="text-3xl font-bold text-emerald-500">{stats.landed}</span>
           </div>

           <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Spam Folder</p>
             <span className="text-3xl font-bold text-red-500">{stats.spam}</span>
           </div>
        </div>

        {/* DNS Health Checks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">DNS Health Check</h3>
             <div className="space-y-4">
               {[
                 { label: 'SPF Record', status: checks.spf, desc: 'Authorizes mail servers' },
                 { label: 'DKIM Signature', status: checks.dkim, desc: 'Verifies email integrity' },
                 { label: 'DMARC Policy', status: checks.dmarc, desc: 'Instructs handling of failures' },
                 { label: 'Blacklist Status', status: checks.blacklist, desc: 'Domain is clean' },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    {item.status ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    ) : analyzing ? (
                      <RefreshCw className="w-5 h-5 text-slate-400 animate-spin" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                    )}
                 </div>
               ))}
             </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">Warmup Activity</h3>
               <button 
                 onClick={toggleWarmup}
                 className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-colors ${
                   warmingUp ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                 }`}
               >
                 {warmingUp ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Start Warmup</>}
               </button>
             </div>
             
             <div className="flex-1 min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={history}>
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{fill: 'transparent'}}
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9' }}
                    />
                    <Bar dataKey="emails" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
             </div>
             <p className="text-center text-xs text-slate-400 mt-4">
               Real-time sending volume (simulated for demo)
             </p>
          </div>
        </div>

      </div>
    </div>
  );
}
