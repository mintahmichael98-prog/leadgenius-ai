
export interface Lead {
  id: number;
  company: string;
  description: string;
  location: string;
  confidence: number;
  website: string;
  contact: string;
  industry: string;
  employees: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  googleMapsUrl?: string;
  socials?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
  management?: {
    name: string;
    role: string;
    linkedin?: string;
  }[];
  status?: LeadStatus;
}

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'negotiation' | 'won' | 'lost';

export enum ViewMode {
  DASHBOARD = 'dashboard',
  LIST = 'list',
  MAP = 'map',
  PIPELINE = 'pipeline',
  ANALYTICS = 'analytics',
  COMPETITORS = 'competitors',
  EMAIL_WARMUP = 'email_warmup',
  LOOKALIKE = 'lookalike'
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  progressStep: number;
  batchesCompleted: number;
  totalLeads: number;
  error: string | null;
}

export interface LeadFilters {
  location: string;
  industry: string;
  employees: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  credits: number;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'search' | 'purchase' | 'bonus';
  amount: number; // Negative for usage, positive for purchase
  description: string;
}

export interface Source {
  title: string;
  url: string;
}

export interface CompetitorAnalysis {
  target: {
    name: string;
    industry: string;
    summary: string;
  };
  competitors: {
    name: string;
    website: string;
    description: string;
    strength: string;
    weakness: string;
    socials?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      instagram?: string;
    };
  }[];
}

export interface AppSettings {
  webhookUrl: string;
  brandVoice: string;
}

export const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Real Estate', 'Retail', 'Manufacturing', 'Education', 'Energy', 'Consulting', 'Marketing', 'Legal', 'Construction', 'Transportation', 'Other'
];
