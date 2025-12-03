/**
 * utils/exportCSV.ts
 * * Utility function to convert a JavaScript array of Lead objects into a CSV string
 * and trigger a download in the browser.
 */

import { Lead } from "../types"; // Assuming Lead type is imported from types.ts

// Helper function to flatten the structure for CSV compatibility
const flattenLead = (lead: Lead) => {
    // Basic fields
    const flattened = {
        id: lead.id,
        company: lead.company || '',
        description: lead.description || '',
        location: lead.location || '',
        confidence: lead.confidence || 0,
        website: lead.website || '',
        contact: lead.contact || '',
        industry: lead.industry || '',
        employees: lead.employees || '',
        
        // Flatten social links
        linkedin_social: lead.socials?.linkedin || '',
        twitter_social: lead.socials?.twitter || '',
        facebook_social: lead.socials?.facebook || '',

        // Flatten management array (simplified to first two executives for CSV columns)
        exec_1_name: lead.management[0]?.name || '',
        exec_1_role: lead.management[0]?.role || '',
        exec_1_linkedin: lead.management[0]?.linkedin || '',
        
        exec_2_name: lead.management[1]?.name || '',
        exec_2_role: lead.management[1]?.role || '',
        exec_2_linkedin: lead.management[1]?.linkedin || '',
    };
    return flattened;
};

// Main export function
export const exportToCSV = (data: Lead[], filename: string = 'leads_export') => {
    if (!data || data.length === 0) {
        console.warn("No data to export.");
        return;
    }

    // 1. Prepare data (flatten nested objects)
    const flattenedData = data.map(flattenLead);

    // 2. Generate CSV Header from keys of the first flattened object
    const headers = Object.keys(flattenedData[0]);
    const csvHeader = headers.map(h => `"${h}"`).join(',') + '\n'; // Quote headers for safety

    // 3. Generate CSV Rows
    const csvRows = flattenedData.map(row => 
        headers.map(header => {
            let value = (row as any)[header] || '';
            // Escape double quotes and enclose the value in quotes if it contains a comma or quote
            value = String(value).replace(/"/g, '""');
            if (value.includes(',') || value.includes('\n') || value.includes('"')) {
                return `"${value}"`;
            }
            return value;
        }).join(',')
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    // 4. Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    
    // Append to body, click, and remove the element
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
