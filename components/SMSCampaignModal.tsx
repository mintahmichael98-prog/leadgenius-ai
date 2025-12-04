
import React, { useState } from 'react';
import { Lead } from '../types';
import { X, MessageSquare, Send, Sparkles, CheckCircle2, AlertCircle, Loader2, Key, User, Smartphone, ExternalLink, Globe, PieChart as PieChartIcon, Ban, Download } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { sendArkeselSMS } from '../services/arkeselService';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Props {
  leads: Lead[];
  isOpen: boolean;
  onClose: () => void;
  brandVoice?: string;
}

interface QueueItem {
  leadId: number;
  leadName: string;
  phone: string;
  status: 'pending' | 'delivered' | 'failed' | 'opted_out';
}

const COLORS = {
  delivered: '#22c55e', // green-500
  failed: '#ef4444',    // red-500
  opted_out: '#f59e0b', // amber-500
  pending: '#cbd5e1'    // slate-300
};

export default function SMSCampaignModal({ leads, isOpen, onClose, brandVoice }: Props) {
  const [step, setStep] = useState<'config' | 'draft' | 'send' | 'analytics'>('config');
  const [apiKey, setApiKey] = useState('');
  const [senderId, setSenderId] = useState('LeadGenius');
  const [messageTemplate, setMessageTemplate] = useState("Hi {{name}}, saw {{company}} and wanted to connect about scaling your leads.");
  const [isGenerating, setIsGenerating] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Initialize queue
  React.useEffect(() => {
    if (leads.length > 0) {
      const newQueue: QueueItem[] = leads.map(lead => {
        // Extract numbers
        let phone = lead.socials?.whatsapp || '';
        if (!phone && lead.contact) {
            const match = lead.contact.match(/[\d\-\+\(\)\s]+/);
            if (match) phone = match[0].replace(/\D/g, '');
        }

        return {
          leadId: lead.id,
          leadName: lead.management?.[0]?.name || 'there',
          phone: phone,
          status: phone ? 'pending' : 'failed'
        };
      });
      setQueue(newQueue);
    }
  }, [leads]);

  if (!isOpen) return null;

  const generateTemplate = async () => {
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const toneInstruction = brandVoice ? `Tone: ${brandVoice}` : "Tone: Professional but urgent.";

      const prompt = `
        Write a hyper-short SMS (under 160 characters) for B2B cold outreach.
        Variables: {{name}}, {{company}}.
        ${toneInstruction}
        Context: Selling lead gen services.
      `;
      
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      
      const text = result.text;
      if (text) setMessageTemplate(text.trim());
    } catch (e) {
      toast.error("AI Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const compileMessage = (template: string, item: QueueItem, company: string) => {
    return template
      .replace(/{{name}}/g, item.leadName)
      .replace(/{{company}}/g, company);
  };

  const startSending = async () => {
    setIsSending(true);
    const newQueue = [...queue];

    // Process sequentially to avoid rate limits and update UI
    for (let i = 0; i < newQueue.length; i++) {
        const item = newQueue[i];
        if (item.status !== 'pending') continue;

        const lead = leads.find(l => l.id === item.leadId);
        if (!lead) continue;

        const msg = compileMessage(messageTemplate, item, lead.company);
        
        // Call Arkesel Service
        const result = await sendArkeselSMS(apiKey, senderId, item.phone, msg);

        newQueue[i].status = result.status;
        setQueue([...newQueue]);
        
        // Small delay between sends
        await new Promise(r => setTimeout(r, 500));
    }
    
    setIsSending(false);
    setStep('analytics'); // Auto move to analytics when done
    toast.success("Campaign Completed");
  };

  const progress = Math.round((queue.filter(q => q.status !== 'pending').length / queue.length) * 100) || 0;

  // Analytics Calculations
  const totalSent = queue.filter(q => q.status !== 'pending').length;
  const delivered = queue.filter(q => q.status === 'delivered').length;
  const failed = queue.filter(q => q.status === 'failed').length;
  const optedOut = queue.filter(q => q.status === 'opted_out').length;
  
  const deliveryRate = totalSent > 0 ? Math.round((delivered / totalSent) * 100) : 0;
  
  const chartData = [
    { name: 'Delivered', value: delivered, color: COLORS.delivered },
    { name: 'Failed', value: failed, color: COLORS.failed },
    { name: 'Opted Out', value: optedOut, color: COLORS.opted_out }
  ].filter(d => d.value > 0);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
               <MessageSquare className="w-6 h-6 text-orange-600 dark:text-orange-500" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">Bulk SMS Gateway</h3>
               <p className="text-sm text-slate-500">Powered by Arkesel • {leads.length} contacts</p>
             </div>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {step === 'config' && (
            <div className="space-y-8">
                {/* Gateway Hero */}
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white text-center shadow-lg relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700"></div>
                  
                  <h4 className="text-2xl font-bold mb-2 relative z-10">New to Arkesel?</h4>
                  <p className="text-orange-50 mb-6 text-sm max-w-sm mx-auto relative z-10">
                    Create a free account to get your API Key and start sending branded SMS campaigns instantly.
                  </p>
                  
                  <a 
                    href="https://arkesel.com/signup" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-bold hover:bg-orange-50 transition-colors shadow-xl relative z-10"
                  >
                    Create Free Account <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Configuration Form */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-5 h-5 text-slate-400" />
                        <h4 className="font-semibold text-slate-900 dark:text-white">Connect Existing Account</h4>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">API Key</label>
                            <div className="relative">
                                <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="Paste your Arkesel V2 API Key"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">Found in Arkesel Dashboard &rarr; Developers &rarr; API Keys</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Sender ID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                <input 
                                    type="text" 
                                    maxLength={11}
                                    value={senderId}
                                    onChange={e => setSenderId(e.target.value)}
                                    placeholder="e.g. LeadGenius"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 ml-1">Must be registered on Arkesel. Max 11 characters.</p>
                        </div>
                    </div>
                </div>
            </div>
          )}

          {step === 'draft' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  SMS Message ({messageTemplate.length} chars)
                </label>
                <div className="relative">
                  <textarea
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none resize-none font-medium"
                  />
                  <div className={`absolute bottom-3 left-3 text-xs font-medium ${messageTemplate.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                      {messageTemplate.length} / 160
                  </div>
                  <button 
                    onClick={generateTemplate}
                    disabled={isGenerating}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Draft
                  </button>
                </div>
                <div className="mt-2 flex gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{'{{name}}'}</span>
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{'{{company}}'}</span>
                </div>
                {brandVoice && (
                  <div className="mt-2 text-xs text-orange-500 font-medium">
                     Using Brand Voice: "{brandVoice}"
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'send' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Sending Progress</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto">
                {queue.map((item, idx) => (
                  <div key={item.leadId} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.status === 'delivered' ? 'bg-green-100 text-green-600' : 
                        item.status === 'failed' ? 'bg-red-100 text-red-500' :
                        item.status === 'opted_out' ? 'bg-amber-100 text-amber-500' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                         {item.status === 'delivered' ? <CheckCircle2 className="w-4 h-4" /> : 
                          item.status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                          item.status === 'opted_out' ? <Ban className="w-4 h-4" /> :
                          <Smartphone className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.leadName}</p>
                        <p className="text-xs text-slate-500">{item.phone || 'No Number'}</p>
                      </div>
                    </div>
                    <div>
                        {item.status === 'delivered' && <span className="text-xs font-bold text-green-600">DELIVERED</span>}
                        {item.status === 'failed' && <span className="text-xs font-bold text-red-500">FAILED</span>}
                        {item.status === 'opted_out' && <span className="text-xs font-bold text-amber-500">OPTOUT</span>}
                        {item.status === 'pending' && <span className="text-xs text-slate-400">WAITING</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'analytics' && (
            <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                    <div className="inline-flex p-3 bg-green-100 dark:bg-green-900/30 rounded-full mb-3">
                        <PieChartIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Campaign Results</h2>
                    <p className="text-slate-500">Delivery report for {queue.length} contacts</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{delivered}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Delivered</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                         <div className="text-2xl font-bold text-red-500">{failed}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Failed</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
                         <div className="text-2xl font-bold text-amber-500">{optedOut}</div>
                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">Opt-Outs</div>
                    </div>
                </div>

                <div className="h-48 w-full relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff', borderRadius: '8px' }} />
                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-20">
                         <div className="text-center">
                             <span className="text-3xl font-bold text-slate-900 dark:text-white block">{deliveryRate}%</span>
                             <span className="text-[10px] text-slate-500 uppercase font-bold">Success Rate</span>
                         </div>
                     </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300">AI Insight</h4>
                        <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                            {deliveryRate > 80 
                                ? "Great delivery rate! Your list quality is high. Follow up with those who didn't opt-out in 3 days." 
                                : "Delivery rate is lower than average. Consider verifying phone numbers before your next blast."}
                        </p>
                    </div>
                </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
           {step === 'config' && (
               <button 
                onClick={() => setStep('draft')} 
                disabled={!apiKey}
                className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold disabled:opacity-50 hover:opacity-90 transition-opacity"
               >
                 Connect & Continue
               </button>
           )}
           {step === 'draft' && (
             <>
               <button onClick={() => setStep('config')} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">Back</button>
               <button 
                 onClick={() => { setStep('send'); startSending(); }} 
                 className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg hover:shadow-orange-500/25"
               >
                 Launch SMS Campaign <Send className="w-4 h-4" />
               </button>
             </>
           )}
           {step === 'send' && (
             <button disabled className="px-6 py-2 bg-slate-300 text-slate-500 rounded-lg font-bold cursor-not-allowed">
               Sending...
             </button>
           )}
           {step === 'analytics' && (
             <button onClick={onClose} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold">
               Close Report
             </button>
           )}
        </div>

      </div>
    </div>
  );
}
