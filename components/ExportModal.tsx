
import React, { useState, useEffect } from 'react';
import { Lead, LeadStatus } from '../types';
import { exportToCSV } from '../utils/exportCSV';
import { X, FileSpreadsheet, Download, Filter, CheckCircle2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: Lead[];
  query: string;
}

const STATUS_OPTIONS: { value: LeadStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Leads', color: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
  { value: 'new', label: 'New Leads', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'qualified', label: 'Qualified', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'won', label: 'Closed Won', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
];

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, leads, query }) => {
  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'all'>('all');
  const [filteredCount, setFilteredCount] = useState(0);

  useEffect(() => {
    const count = selectedStatus === 'all' 
      ? leads.length 
      : leads.filter(l => l.status === selectedStatus).length;
    setFilteredCount(count);
  }, [selectedStatus, leads]);

  if (!isOpen) return null;

  const handleExport = () => {
    const leadsToExport = selectedStatus === 'all' 
      ? leads 
      : leads.filter(l => l.status === selectedStatus);
    
    // Append status to query name for file clarity
    const exportName = selectedStatus === 'all' ? query : `${query}_${selectedStatus}`;
    
    exportToCSV(leadsToExport, exportName);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Export Report</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Download pipeline data</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Filter by Pipeline Stage
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as LeadStatus | 'all')}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-slate-900 dark:text-white"
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div className="absolute left-3 top-3.5 pointer-events-none">
                <Filter className="w-5 h-5 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Target Audience</span>
              <span className="text-xs text-slate-400 truncate max-w-[150px]">{query}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Leads Found</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{filteredCount}</span>
            </div>
            {selectedStatus !== 'all' && (
              <div className="mt-2 text-xs text-indigo-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Filtered by '{STATUS_OPTIONS.find(o => o.value === selectedStatus)?.label}'
              </div>
            )}
          </div>

          <button
            onClick={handleExport}
            disabled={filteredCount === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-500/25"
          >
            <Download className="w-5 h-5" />
            Download CSV Report
          </button>
        </div>

      </div>
    </div>
  );
};
