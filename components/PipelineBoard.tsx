
import React, { useState } from 'react';
import { Lead, LeadStatus } from '../types';
import { MoreHorizontal, Phone, Mail, CheckCircle2, XCircle, DollarSign, MessageCircle } from 'lucide-react';

interface Props {
  leads: Lead[];
  onStatusChange: (id: number, newStatus: LeadStatus) => void;
}

const COLUMNS: { id: LeadStatus; label: string; color: string }[] = [
  { id: 'new', label: 'New Leads', color: 'bg-slate-100 dark:bg-slate-800' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-50 dark:bg-blue-900/20' },
  { id: 'qualified', label: 'Qualified', color: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-purple-50 dark:bg-purple-900/20' },
  { id: 'won', label: 'Closed Won', color: 'bg-green-50 dark:bg-green-900/20' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50 dark:bg-red-900/20' },
];

export default function PipelineBoard({ leads, onStatusChange }: Props) {
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, id: number) => {
    setDraggedLeadId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: LeadStatus) => {
    e.preventDefault();
    if (draggedLeadId !== null) {
      onStatusChange(draggedLeadId, status);
      setDraggedLeadId(null);
    }
  };

  const getStatusIcon = (status: LeadStatus) => {
    switch(status) {
      case 'won': return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'lost': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'negotiation': return <DollarSign className="w-4 h-4 text-purple-600" />;
      case 'contacted': return <MessageCircle className="w-4 h-4 text-blue-600" />;
      default: return <div className="w-2 h-2 rounded-full bg-slate-400" />;
    }
  };

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden p-6">
      <div className="flex gap-6 h-full min-w-[1200px]">
        {COLUMNS.map(col => {
          const columnLeads = leads.filter(l => (l.status || 'new') === col.id);
          
          return (
            <div 
              key={col.id}
              className={`w-80 flex-shrink-0 flex flex-col rounded-xl border border-slate-200 dark:border-slate-700 ${col.color} transition-colors`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700/50 flex justify-between items-center">
                <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200">
                  {getStatusIcon(col.id)}
                  {col.label}
                </div>
                <span className="bg-white dark:bg-slate-700 px-2 py-0.5 rounded-full text-xs font-medium text-slate-500">
                  {columnLeads.length}
                </span>
              </div>

              {/* Cards Area */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {columnLeads.map(lead => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-move hover:shadow-md transition-shadow group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate pr-6">{lead.company}</h4>
                       <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                         <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </div>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 line-clamp-2" title={lead.description}>
                      {lead.description}
                    </p>

                    <div className="flex items-center gap-2 mb-3">
                       <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                         lead.confidence > 80 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                       }`}>
                         {lead.confidence}% Match
                       </span>
                       <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded truncate max-w-[100px]">
                         {lead.industry}
                       </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-2">
                        <div className="flex items-center gap-1">
                           {lead.management?.[0] ? (
                             <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[10px] font-bold">
                               {lead.management[0].name.charAt(0)}
                             </div>
                           ) : (
                             <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700" />
                           )}
                           <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                             {lead.management?.[0]?.name || 'Unknown'}
                           </span>
                        </div>
                        
                        <div className="flex gap-2">
                           {lead.socials?.whatsapp && (
                             <a href={`https://wa.me/${lead.socials.whatsapp}`} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-[#25D366] transition-colors">
                               <MessageCircle className="w-3.5 h-3.5" />
                             </a>
                           )}
                           {/[0-9]/.test(lead.contact) && (
                             <span className="text-slate-400" title={lead.contact}>
                               <Phone className="w-3.5 h-3.5" />
                             </span>
                           )}
                        </div>
                    </div>
                  </div>
                ))}
                
                {columnLeads.length === 0 && (
                   <div className="h-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center text-xs text-slate-400">
                     Drop here
                   </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
