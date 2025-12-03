import React, { useState } from 'react';
import { X, Check, Zap, CreditCard, Loader2 } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (amount: number, plan: 'pro' | 'enterprise') => Promise<void>;
}

export const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose, onPurchase }) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBuy = async (plan: 'pro' | 'enterprise', amount: number) => {
    setIsLoading(plan);
    await onPurchase(amount, plan);
    setIsLoading(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700 relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Upgrade your Pipeline</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10">Choose a credit package to generate more verified leads.</p>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Pro Plan */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-left hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors relative bg-slate-50 dark:bg-slate-800/50">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                Most Popular
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Growth Pack</h3>
              <div className="my-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$49</span>
                <span className="text-slate-500 dark:text-slate-400 ml-2">/ one-time</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Perfect for small teams and startups looking to scale.</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" /> 1,000 Verified Leads
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" /> Export to CSV
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" /> Email & LinkedIn Discovery
                </li>
              </ul>

              <button 
                onClick={() => handleBuy('pro', 1000)}
                disabled={!!isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isLoading === 'pro' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-4 h-4" /> Buy 1,000 Credits</>}
              </button>
            </div>

            {/* Enterprise Plan */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-left hover:border-purple-500 dark:hover:border-purple-500 transition-colors bg-white dark:bg-slate-800">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise Pack</h3>
              <div className="my-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-slate-900 dark:text-white">$199</span>
                <span className="text-slate-500 dark:text-slate-400 ml-2">/ one-time</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">For high-volume agencies and enterprise sales teams.</p>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" /> 5,000 Verified Leads
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" /> Priority Support
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check className="w-4 h-4 text-emerald-500" /> API Access
                </li>
              </ul>

              <button 
                onClick={() => handleBuy('enterprise', 5000)}
                disabled={!!isLoading}
                className="w-full py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
              >
                {isLoading === 'enterprise' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-4 h-4" /> Buy 5,000 Credits</>}
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-xs text-slate-400">
            Secured by Stripe. 30-day money-back guarantee.
          </div>
        </div>
      </div>
    </div>
  );
};