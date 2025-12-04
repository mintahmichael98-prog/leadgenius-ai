import { Lead } from '../types.ts';
import { APOLLO_API_KEY, APOLLO_BASE_URL } from '../config.ts';

// Helper function to fetch with backoff (similar to Gemini service)
async function fetchWithBackoff(url: string, options: RequestInit, maxRetries = 5): Promise<any> {
    if (APOLLO_API_KEY === 'YOUR_APOLLO_API_KEY_HERE_FROM_VERCEL') {
        // Allow function to proceed, but log an error or use placeholder data
        console.error("APOLLO API Key is missing. Using placeholder data for enrichment.");
        return null;
    }
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const response = await fetch(url, options);

            if (response.status === 429 && attempt < maxRetries - 1) {
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok) {
                const errorBody = await response.json();
                // If it's a non-fatal API error (e.g., lead not found), we return null to use placeholder
                if (response.status === 404 || response.status === 400) {
                    return null; 
                }
                throw new Error(`Apollo API error: ${response.status} - ${errorBody.error || errorBody.errors?.[0]?.message || 'Unknown error'}`);
            }

            return await response.json();

        } catch (error) {
            if (attempt === maxRetries - 1) {
                 console.error("Failed all attempts to call Apollo API:", error);
                 throw error;
            }
        }
    }
    return null; // Fallback if all retries fail
}


/**
 * Enriches a lead object with contact information using the Apollo.io API.
 * This simulates finding the CEO or a key executive based on the company's website.
 * @param lead The lead object with a verified website.
 * @returns A promise resolving to the enriched Lead object.
 */
export async function enrichWithApollo(lead: Lead): Promise<Lead> {
    if (APOLLO_API_KEY === 'YOUR_APOLLO_API_KEY_HERE_FROM_VERCEL') {
        // Return with dummy data if API key is missing
        return {
            ...lead,
            email: 'placeholder@example.com',
            contactName: 'Jane Doe (Placeholder)',
            phone: '(555) 555-0001',
            revenue: '$5M', // Dummy data
            employees: '25', // Dummy data
        };
    }

    // 1. Find a contact at the company
    const findContactUrl = `${APOLLO_BASE_URL}/contacts/search`;
    const contactPayload = {
        api_key: APOLLO_API_KEY,
        q_organization_domains: [new URL(lead.website).hostname],
        person_titles: ["CEO", "Founder", "VP of Sales", "Head of Marketing"], // Target key roles
        sort_by: "job_title", // Prioritize title relevance
        page: 1,
        per_page: 1
    };

    const contactResponse = await fetchWithBackoff(findContactUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactPayload)
    });

    const contact = contactResponse?.contacts?.[0];
    
    let enrichedLead = { ...lead };

    if (contact) {
        enrichedLead.contactName = `${contact.first_name} ${contact.last_name} (${contact.title})`;
        enrichedLead.email = contact.email;
        // Phone numbers can be tricky, use organization's if contact doesn't have a direct one
        enrichedLead.phone = contact.phone || lead.phone || 'N/A';
    } else {
        console.warn(`Could not find a specific contact for: ${lead.company}`);
    }

    // 2. Find company details for revenue/employee count
    const findOrgUrl = `${APOLLO_BASE_URL}/organizations/enrich`;
    const orgPayload = {
        api_key: APOLLO_API_KEY,
        domain: new URL(lead.website).hostname,
    };

    const orgResponse = await fetchWithBackoff(findOrgUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgPayload)
    });

    const organization = orgResponse?.organization;
    
    if (organization) {
        enrichedLead.revenue = organization.annual_revenue ? `$${(organization.annual_revenue / 1000000).toFixed(1)}M` : 'N/A';
        enrichedLead.employees = organization.num_employees ? organization.num_employees.toString() : 'N/A';
    } else {
         console.warn(`Could not find organization details for: ${lead.company}`);
    }


    return enrichedLead;
}import { Lead } from '../types';

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
