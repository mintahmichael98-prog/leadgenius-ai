
import React, { useState, useEffect } from 'react';
import { Lead } from '../types';
import { X, MessageCircle, Send, Sparkles, CheckCircle2, AlertCircle, Loader2, Copy, ExternalLink } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import toast from 'react-hot-toast';

interface Props {
  leads: Lead[];
  isOpen: boolean;
  onClose: () => void;
  brandVoice?: string;
}

interface QueueItem {
  leadId: number;
  leadName: string;
  leadCompany: string;
  phone: string;
  status: 'pending' | 'sent' | 'failed' | 'skipped';
}

export default function WhatsAppCampaignModal({ leads, isOpen, onClose, brandVoice }: Props) {
  const [step, setStep] = useState<'draft' | 'send'>('draft');
  const [messageTemplate, setMessageTemplate] = useState("Hi {{name}}, I noticed {{company}} is doing great work in the {{industry}} space. Would love to connect!");
  const [isGenerating, setIsGenerating] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  
  // Initialize queue when leads change
  useEffect(() => {
    if (leads.length > 0) {
      const newQueue: QueueItem[] = leads.map(lead => {
        // Prioritize WhatsApp number, then fallback to cleaning the contact string
        let phone = lead.socials?.whatsapp || '';
        
        if (!phone && lead.contact) {
            // Extract potential phone number from contact string "123456 | email"
            const match = lead.contact.match(/[\d\-\+\(\)\s]+/);
            if (match) {
                // Clean non-numeric characters
                phone = match[0].replace(/\D/g, '');
            }
        }

        return {
          leadId: lead.id,
          leadName: lead.management?.[0]?.name || 'there',
          leadCompany: lead.company,
          phone: phone,
          status: phone ? 'pending' : 'failed' // Auto-fail if no phone
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
      const toneInstruction = brandVoice ? `Tone: ${brandVoice}` : "Tone: Friendly, direct, not salesy.";
      
      const prompt = `
        Write a short, casual, and professional WhatsApp message template for B2B cold outreach.
        Keep it under 30 words.
        Use variables: {{name}} for person's name, {{company}} for company name, {{industry}} for industry.
        ${toneInstruction}
        Goal: Start a conversation.
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

  const compileMessage = (template: string, item: QueueItem) => {
    const lead = leads.find(l => l.id === item.leadId);
    if (!lead) return template;
    
    return template
      .replace(/{{name}}/g, item.leadName)
      .replace(/{{company}}/g, item.leadCompany)
      .replace(/{{industry}}/g, lead.industry || 'your industry');
  };

  const handleSend = (index: number) => {
    const item = queue[index];
    if (!item.phone) return;

    const msg = compileMessage(messageTemplate, item);
    const url = `https://wa.me/${item.phone}?text=${encodeURIComponent(msg)}`;
    
    window.open(url, '_blank');
    
    // Update status
    const newQueue = [...queue];
    newQueue[index].status = 'sent';
    setQueue(newQueue);
  };

  const markSkipped = (index: number) => {
    const newQueue = [...queue];
    newQueue[index].status = 'skipped';
    setQueue(newQueue);
  };

  const progress = Math.round((queue.filter(q => q.status === 'sent').length / queue.length) * 100) || 0;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-3">
             <div className="p-2 bg-[#25D366]/10 rounded-lg">
               <MessageCircle className="w-6 h-6 text-[#25D366]" />
             </div>
             <div>
               <h3 className="text-xl font-bold text-slate-900 dark:text-white">WhatsApp Broadcast</h3>
               <p className="text-sm text-slate-500">Targeting {leads.length} contacts</p>
             </div>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
             <X className="w-6 h-6" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {step === 'draft' ? (
            <div className="space-y-6">
              {/* Draft Section */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> AI Strategy
                </h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  WhatsApp messages should be extremely short and personal. Use the AI to generate a high-response conversational opener.
                  {brandVoice && <span className="block mt-1 font-semibold">Using Brand Voice: "{brandVoice}"</span>}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Message Template
                </label>
                <div className="relative">
                  <textarea
                    value={messageTemplate}
                    onChange={(e) => setMessageTemplate(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#25D366] outline-none resize-none font-medium"
                    placeholder="Hi {{name}}..."
                  />
                  <button 
                    onClick={generateTemplate}
                    disabled={isGenerating}
                    className="absolute bottom-3 right-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs rounded-lg flex items-center gap-1 transition-colors shadow-sm"
                  >
                    {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Rewrite with AI
                  </button>
                </div>
                <div className="mt-2 flex gap-2 text-xs text-slate-500">
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{'{{name}}'}</span>
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{'{{company}}'}</span>
                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">{'{{industry}}'}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Preview (First Contact)</h4>
                <div className="bg-[#DCF8C6] dark:bg-[#056162] p-4 rounded-lg rounded-tl-none inline-block max-w-sm shadow-sm">
                   <p className="text-slate-800 dark:text-white whitespace-pre-wrap">
                      {queue.length > 0 ? compileMessage(messageTemplate, queue[0]) : "No leads selected"}
                   </p>
                   <span className="text-[10px] text-slate-500 dark:text-slate-300 block text-right mt-1">12:00 PM</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Queue Section */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-500">Progress</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{progress}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#25D366] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="space-y-2 mt-4 max-h-[300px] overflow-y-auto pr-2">
                {queue.map((item, idx) => (
                  <div key={item.leadId} className={`flex items-center justify-between p-3 rounded-lg border ${
                    item.status === 'sent' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900' :
                    item.status === 'failed' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 opacity-60' :
                    'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        item.status === 'sent' ? 'bg-green-100 text-green-600' : 
                        item.status === 'failed' ? 'bg-red-100 text-red-500' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-500'
                      }`}>
                         {item.status === 'sent' ? <CheckCircle2 className="w-4 h-4" /> : 
                          item.status === 'failed' ? <AlertCircle className="w-4 h-4" /> :
                          <span className="text-xs font-bold">{idx + 1}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.leadName}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[150px]">{item.leadCompany}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status === 'pending' && (
                        <>
                           <button 
                             onClick={() => markSkipped(idx)}
                             className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-xs"
                           >
                             Skip
                           </button>
                           <button 
                             onClick={() => handleSend(idx)}
                             className="flex items-center gap-2 px-3 py-1.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-md text-xs font-bold transition-transform active:scale-95 shadow-sm"
                           >
                             Send <ExternalLink className="w-3 h-3" />
                           </button>
                        </>
                      )}
                      {item.status === 'sent' && <span className="text-xs font-medium text-green-600 dark:text-green-400 px-3">Sent</span>}
                      {item.status === 'skipped' && <span className="text-xs font-medium text-slate-400 px-3">Skipped</span>}
                      {item.status === 'failed' && <span className="text-xs font-medium text-red-500 px-3">No Number</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-xl">
           {step === 'draft' ? (
             <>
               <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg">Cancel</button>
               <button 
                 onClick={() => setStep('send')} 
                 className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold flex items-center gap-2 hover:opacity-90 transition-opacity"
               >
                 Start Campaign <Send className="w-4 h-4" />
               </button>
             </>
           ) : (
             <button onClick={onClose} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold">
               Done
             </button>
           )}
        </div>

      </div>
    </div>
  );
}
