
import React, { useState, useEffect } from 'react';
import { X, Plug, User, Save, Bell, Globe } from 'lucide-react';
import { AppSettings } from '../types';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export default function SettingsModal({ isOpen, onClose, settings, onSave }: Props) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
    toast.success("Settings saved successfully");
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Settings & Configuration
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
          
          {/* Integrations Section */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Plug className="w-5 h-5 text-indigo-600" /> Integrations
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={localSettings.webhookUrl}
                  onChange={(e) => setLocalSettings(s => ({ ...s, webhookUrl: e.target.value }))}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="flex-1 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                We will send a JSON POST request to this URL whenever a lead's status is updated in the pipeline.
              </p>
            </div>
          </section>

          {/* Brand Voice Section */}
          <section>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-indigo-600" /> Brand Persona
            </h3>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Global Tone & Voice
              </label>
              <textarea
                value={localSettings.brandVoice}
                onChange={(e) => setLocalSettings(s => ({ ...s, brandVoice: e.target.value }))}
                placeholder="e.g. Professional, authoritative, and concise. Use industry jargon but keep it friendly."
                className="w-full h-24 px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
              />
              <p className="text-xs text-slate-500 mt-2">
                This persona will be instructed to the AI when generating Emails, SMS, and WhatsApp drafts.
              </p>
            </div>
          </section>

        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}
