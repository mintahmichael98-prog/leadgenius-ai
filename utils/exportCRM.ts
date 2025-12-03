import { Lead } from '../types';
import toast from 'react-hot-toast';

export const exportToHubSpot = async (leads: Lead[]) => {
  const toastId = toast.loading('Connecting to HubSpot...');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  toast.dismiss(toastId);
  toast.success(`Successfully exported ${leads.length} leads to HubSpot CRM`);
};

export const exportToSalesforce = async (leads: Lead[]) => {
  const toastId = toast.loading('Connecting to Salesforce...');
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  toast.dismiss(toastId);
  toast.success(`Successfully exported ${leads.length} leads to Salesforce`);
};