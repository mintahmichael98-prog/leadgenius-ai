import { Lead } from '../types';

export const enrichWithApollo = async (lead: Lead): Promise<Lead> => {
  // Simulate network delay for enrichment
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // In a real production app, this would call the Apollo.io API
  // For now, we return the lead as-is, potentially adding a flag
  return {
    ...lead,
    // Example of enrichment: Ensure industry exists
    industry: lead.industry || "Unknown"
  };
};