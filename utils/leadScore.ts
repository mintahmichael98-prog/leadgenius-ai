import { Lead } from '../types';

export const calculateLeadScore = (lead: Lead): number => {
  let score = lead.confidence || 50;

  // Industry weights
  const highValueIndustries = ['Technology', 'Finance', 'SaaS', 'Healthcare', 'Software'];
  if (highValueIndustries.some(i => lead.industry.includes(i))) {
    score += 10;
  }

  // Completeness weights
  if (lead.contact && lead.contact !== 'N/A') score += 15;
  if (lead.website) score += 10;
  if (lead.management && lead.management.length > 0) score += 10;
  if (lead.socials?.linkedin) score += 5;

  return Math.min(100, score);
};