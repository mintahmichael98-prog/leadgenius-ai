import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: any;
  content: React.ReactNode;
}

const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, icon: Icon, content }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white">
            <Icon className="w-5 h-5" /> {title}
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-6 overflow-y-auto text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4">
          {content}
        </div>
      </div>
    </div>
  );
};

export const TermsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title="Terms of Service"
    icon={FileText}
    content={
      <>
        <p><strong>1. Introduction</strong><br/>Welcome to LeadGenius AI. By accessing our website and using our services, you agree to comply with these terms.</p>
        <p><strong>2. Services</strong><br/>LeadGenius AI provides business-to-business lead generation services using artificial intelligence.</p>
        <p><strong>3. Usage Limits</strong><br/>Users are limited to the number of credits purchased. Automated scraping of our platform is prohibited.</p>
        <p><strong>4. Data Accuracy</strong><br/>While we strive for accuracy, AI-generated data may verify over time. We do not guarantee 100% accuracy of contact information.</p>
        <p><strong>5. Refund Policy</strong><br/>Refunds are available within 30 days of purchase if no credits have been used.</p>
      </>
    }
  />
);

export const PrivacyModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <BaseModal
    isOpen={isOpen}
    onClose={onClose}
    title="Privacy Policy"
    icon={Shield}
    content={
      <>
        <p><strong>1. Data Collection</strong><br/>We collect email addresses and usage data to improve our services and process payments.</p>
        <p><strong>2. Data Usage</strong><br/>Your search queries are processed by Google Gemini AI. We do not sell your personal search history to third parties.</p>
        <p><strong>3. Security</strong><br/>We use industry-standard encryption to protect your account information and payment details.</p>
        <p><strong>4. Cookies</strong><br/>We use cookies to maintain your session and preference settings.</p>
      </>
    }
  />
);