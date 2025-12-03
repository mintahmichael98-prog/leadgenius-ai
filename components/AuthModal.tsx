import React, { useState } from 'react';
import { Zap, Loader2, ArrowRight, Shield, Facebook, Linkedin, Mail } from 'lucide-react';

// Google Logo SVG
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

interface AuthModalProps {
  onLogin: (email: string) => Promise<void>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(provider);
    // Simulate obtaining email from social provider
    await new Promise(r => setTimeout(r, 800)); // Simulate network request
    const timestamp = Date.now().toString().slice(-4);
    const mockEmail = `user.${provider.toLowerCase()}.${timestamp}@example.com`;
    await onLogin(mockEmail);
    setIsLoading(null);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading('email');
    await onLogin(email);
    setIsLoading(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-300">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Zap className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to LeadGenius</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            The AI-powered B2B lead generation platform. Sign in to access your dashboard.
          </p>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleSocialLogin('Google')}
              disabled={!!isLoading}
              className="w-full py-2.5 px-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg text-slate-700 dark:text-white font-medium transition-all flex items-center justify-center gap-3 relative"
            >
              {isLoading === 'Google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              <span>Continue with Google</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('Facebook')}
              disabled={!!isLoading}
              className="w-full py-2.5 px-4 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-3"
            >
              {isLoading === 'Facebook' ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Facebook className="w-5 h-5 fill-current" />}
              <span>Continue with Facebook</span>
            </button>
            
            <button
              onClick={() => handleSocialLogin('LinkedIn')}
              disabled={!!isLoading}
              className="w-full py-2.5 px-4 bg-[#0077b5] hover:bg-[#006e9c] text-white rounded-lg font-medium transition-all flex items-center justify-center gap-3"
            >
              {isLoading === 'LinkedIn' ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Linkedin className="w-5 h-5 fill-current" />}
              <span>Continue with LinkedIn</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-800 px-2 text-slate-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="text-left relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
            
            <button 
              type="submit" 
              disabled={!!isLoading}
              className="w-full py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {isLoading === 'email' ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Sign In <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-3 h-3" />
            <span>Secure Enterprise Login</span>
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/50 px-8 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};