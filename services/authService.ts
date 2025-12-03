import { UserProfile, Transaction } from "../types";

// --- MOCK BACKEND SERVICE ---
// In a real app, this would be replaced by Supabase/Firebase calls.

const STORAGE_KEY_USER = 'leadgenius_user';
const STORAGE_KEY_TRANSACTIONS = 'leadgenius_transactions';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const authService = {
  // Simulate Login/Signup
  login: async (email: string): Promise<UserProfile> => {
    await delay(800);
    const existing = localStorage.getItem(`${STORAGE_KEY_USER}_${email}`);
    
    if (existing) {
      return JSON.parse(existing);
    } else {
      // New User Signup
      const newUser: UserProfile = {
        id: Date.now().toString(),
        email,
        name: email.split('@')[0],
        credits: 50, // Sign up bonus
        plan: 'free',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(`${STORAGE_KEY_USER}_${email}`, JSON.stringify(newUser));
      
      // Record initial transaction
      const tx: Transaction = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type: 'bonus',
        amount: 50,
        description: 'Welcome Bonus'
      };
      const txs = [tx];
      localStorage.setItem(`${STORAGE_KEY_TRANSACTIONS}_${email}`, JSON.stringify(txs));
      
      return newUser;
    }
  },

  // Get User Profile
  getUser: async (email: string): Promise<UserProfile> => {
    // await delay(200);
    const userStr = localStorage.getItem(`${STORAGE_KEY_USER}_${email}`);
    if (!userStr) throw new Error("User not found");
    return JSON.parse(userStr);
  },

  // Simulate Credit Deduction
  deductCredits: async (email: string, amount: number, description: string): Promise<UserProfile> => {
    // await delay(200);
    const userStr = localStorage.getItem(`${STORAGE_KEY_USER}_${email}`);
    if (!userStr) throw new Error("User not found");
    
    const user: UserProfile = JSON.parse(userStr);
    
    if (user.credits < amount) {
      throw new Error("Insufficient credits");
    }

    user.credits -= amount;
    localStorage.setItem(`${STORAGE_KEY_USER}_${email}`, JSON.stringify(user));

    // Log Transaction
    const tx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'search',
      amount: -amount,
      description
    };
    authService.addTransaction(email, tx);

    return user;
  },

  // Simulate Buying Credits
  addCredits: async (email: string, amount: number, plan: 'pro' | 'enterprise'): Promise<UserProfile> => {
    await delay(1000);
    const userStr = localStorage.getItem(`${STORAGE_KEY_USER}_${email}`);
    if (!userStr) throw new Error("User not found");

    const user: UserProfile = JSON.parse(userStr);
    user.credits += amount;
    user.plan = plan; // Upgrade plan
    localStorage.setItem(`${STORAGE_KEY_USER}_${email}`, JSON.stringify(user));

    const tx: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: 'purchase',
      amount: amount,
      description: `Purchased ${plan.toUpperCase()} Plan`
    };
    authService.addTransaction(email, tx);

    return user;
  },

  getTransactions: (email: string): Transaction[] => {
    const txs = localStorage.getItem(`${STORAGE_KEY_TRANSACTIONS}_${email}`);
    return txs ? JSON.parse(txs) : [];
  },

  addTransaction: (email: string, tx: Transaction) => {
    const txs = authService.getTransactions(email);
    txs.unshift(tx); // Add to top
    localStorage.setItem(`${STORAGE_KEY_TRANSACTIONS}_${email}`, JSON.stringify(txs));
  },

  logout: () => {
    // Just client side cleanup
  }
};