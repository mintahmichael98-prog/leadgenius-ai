import React, { useState } from 'react';
import { Lead } from '../types';
import { ExternalLink, Mail, Building, MapPin, Linkedin, Twitter, Facebook, Globe, User } from 'lucide-react';

interface LeadTableProps {
  leads: Lead[];
}

const LeadTable: React.FC<LeadTableProps> = ({ leads }) => {
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(leads.length / itemsPerPage);

  const paginatedLeads = leads.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score >= 70) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col h-full">
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-700/50 sticky top-0 z-10">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Company</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Industry & Location</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Key People</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Socials & Web</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {paginatedLeads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 max-w-[250px]">
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    {lead.company}
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1 truncate" title={lead.description}>
                    {lead.description}
                  </div>
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getConfidenceColor(lead.confidence)}`}>
                      {lead.confidence}% Verified
                    </span>
                  </div>
                </td>
                
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 w-fit">
                      {lead.industry}
                    </span>
                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {lead.location}
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                    {lead.management && lead.management.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            {lead.management.slice(0, 2).map((person, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded-full">
                                        <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex flex-col leading-none">
                                        <span className="text-slate-700 dark:text-slate-200 font-medium">{person.name}</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-xs text-slate-500 dark:text-slate-400">{person.role}</span>
                                            {person.linkedin && (
                                                <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400">
                                                    <Linkedin className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Not found</span>
                    )}
                </td>

                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-2">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span className="truncate max-w-[150px]" title={lead.contact}>{lead.contact}</span>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {lead.website && (
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors"
                        title="Website"
                      >
                        <Globe className="w-5 h-5" />
                      </a>
                    )}
                    {lead.socials?.linkedin && (
                      <a
                        href={lead.socials.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-[#0077b5] dark:text-slate-400 dark:hover:text-[#0077b5] transition-colors"
                        title="LinkedIn"
                      >
                        <Linkedin className="w-5 h-5" />
                      </a>
                    )}
                    {lead.socials?.twitter && (
                      <a
                        href={lead.socials.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-[#1DA1F2] dark:text-slate-400 dark:hover:text-[#1DA1F2] transition-colors"
                        title="Twitter"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                     {lead.socials?.facebook && (
                      <a
                        href={lead.socials.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-500 hover:text-[#1877F2] dark:text-slate-400 dark:hover:text-[#1877F2] transition-colors"
                        title="Facebook"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {leads.length > 0 && (
        <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Showing <span className="font-medium">{(page - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(page * itemsPerPage, leads.length)}</span> of <span className="font-medium">{leads.length}</span> results
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadTable;