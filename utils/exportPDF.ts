import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

export const exportDashboardToPDF = async () => {
  const element = document.getElementById('dashboard-content');
  if (!element) {
    toast.error('Dashboard content not found');
    return;
  }

  const toastId = toast.loading('Generating Snapshot...');

  try {
    const isDark = document.documentElement.classList.contains('dark');
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: isDark ? '#0f172a' : '#f8fafc', // slate-900 or slate-50
      logging: false,
      useCORS: true
    });

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `LeadGenius_Report_${new Date().toISOString().split('T')[0]}.png`;
    link.click();
    
    toast.success('Report downloaded successfully');
  } catch (error) {
    console.error(error);
    toast.error('Failed to generate report');
  } finally {
    toast.dismiss(toastId);
  }
};