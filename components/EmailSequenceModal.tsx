
import React, { useState } from 'react';
import { Lead } from '../types';
import { X, Send, Copy, Loader2, Sparkles, Wand2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import toast from 'react-hot-toast';

interface Props {
  lead: Lead;
  isOpen: boolean;
  onClose: () => void;
  brandVoice?: string;
}

export default function EmailSequenceModal({ lead, isOpen, onClose, brandVoice }: Props) {
  const [loading, setLoading] = useState(false);
  const [emailContent, setEmailContent] = useState('');

  if (!isOpen) return null;

  const generateEmail = async () => {
    setLoading(true);
    try {
        // Use the globally available API key from the environment
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const contactName = lead.management?.[0]?.name || 'Hiring Manager';
        const toneInstruction = brandVoice ? `BRAND VOICE: ${brandVoice}` : "Tone: Professional, concise, value-driven, and not spammy.";
        
        const prompt = `
          Write a high-converting cold outreach email to ${lead.company}.
          
          Target: ${contactName} (${lead.management?.[0]?.role || 'Decision Maker'})
          Industry: ${lead.industry}
          Location: ${lead.location}
          
          Context: I am offering a B2B lead generation service called "LeadGenius".
          Goal: Book a 15-minute demo.
          ${toneInstruction}
          
          Subject Line: [Generate a catchy subject]
          Body: [Generate the email body]
        `;

        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        
        const text = result.text;
        if (text) setEmailContent(text);
        else throw new Error("No response");

    } catch (e: any) {
        toast.error("Failed to generate email: " + e.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
               <Wand2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
             </div>
             <div>
               <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI Outreach Composer</h3>
               <p className="text-xs text-slate-500">Drafting for {lead.company}</p>
             </div>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
             <X className="w-5 h-5" />
           </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
            {!emailContent && !loading && (
                <div className="text-center py-12 flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/20">
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Generate Personalized Outreach</h4>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8">
                      Use Gemini AI to craft a tailored cold email to <span className="font-semibold text-slate-700 dark:text-slate-300">{lead.company}</span> based on their industry and key decision makers.
                      {brandVoice && <span className="block mt-2 text-indigo-500 text-xs">Using Brand Voice: "{brandVoice}"</span>}
                    </p>
                    <button 
                      onClick={generateEmail} 
                      className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> Generate Email
                    </button>
                </div>
            )}
            
            {loading && (
                <div className="text-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300 font-medium">Analyzing prospect data...</p>
                    <p className="text-sm text-slate-400 mt-2">Crafting the perfect hook</p>
                </div>
            )}

            {emailContent && (
                <div className="space-y-4 animate-fade-in">
                    <div className="relative">
                      <textarea 
                          className="w-full h-80 p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200"
                          value={emailContent}
                          onChange={(e) => setEmailContent(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                          onClick={() => {navigator.clipboard.writeText(emailContent); toast.success("Copied to clipboard");}} 
                          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg font-medium transition-colors"
                        >
                            <Copy className="w-4 h-4" /> Copy Text
                        </button>
                        <button 
                          onClick={() => toast.success("Sent to outbox!")} 
                          className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium shadow-md transition-colors"
                        >
                            <Send className="w-4 h-4" /> Send Email
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
