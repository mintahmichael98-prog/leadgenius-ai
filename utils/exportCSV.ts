
import { Lead } from '../types';
import toast from 'react-hot-toast';

const escapeCsvField = (field: any): string => {
  if (field === undefined || field === null) return '';
  const stringField = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

export const exportToCSV = (leads: Lead[], query: string) => {
  if (leads.length === 0) {
    toast.error("No leads to export");
    return;
  }

  const headers = [
    "Company",
    "Description",
    "Location",
    "Confidence",
    "Industry",
    "Website",
    "Contact",
    "Employees",
    "Key People",
    "WhatsApp",
    "Company LinkedIn",
    "Instagram",
    "Twitter",
    "Facebook"
  ];

  const rows = leads.map(lead => {
    // Format management as "Name (Role) - Link"
    const managementText = lead.management
      ?.map(p => {
        // Use smart search link if direct link isn't available
        const link = p.linkedin || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(p.name + " " + lead.company)}`;
        return `${p.name} (${p.role}) - ${link}`;
      })
      .join('; ');

    const whatsappLink = lead.socials?.whatsapp ? `https://wa.me/${lead.socials.whatsapp}` : '';

    return [
      lead.company,
      lead.description,
      lead.location,
      `${lead.confidence}%`,
      lead.industry,
      lead.website,
      lead.contact,
      lead.employees,
      managementText,
      whatsappLink,
      lead.socials?.linkedin || '',
      lead.socials?.instagram || '',
      lead.socials?.twitter || '',
      lead.socials?.facebook || ''
    ].map(escapeCsvField).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  const timestamp = new Date().toISOString().split('T')[0];
  link.download = `LeadGenius_${query.replace(/[^a-z0-9]/gi, '_')}_${timestamp}.csv`;
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  toast.success(`Exported ${leads.length} leads to CSV`);
};
