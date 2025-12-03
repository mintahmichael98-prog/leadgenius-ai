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
  socials?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  management?: {
    name: string;
    role: string;
    linkedin?: string;
  }[];
}

export enum ViewMode {
  DASHBOARD = 'dashboard',
  LIST = 'list',
  ANALYTICS = 'analytics'
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  progressStep: number;
  batchesCompleted: number;
  totalLeads: number;
  error: string | null;
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

export const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Real Estate', 'Retail', 'Manufacturing', 'Education', 'Energy', 'Other'
];