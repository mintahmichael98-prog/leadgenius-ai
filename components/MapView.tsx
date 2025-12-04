
import React, { useEffect, useRef, useState } from 'react';
import { Lead } from '../types';
import { MapPin, Building, Globe, Loader2, Navigation } from 'lucide-react';

// Declare L for Leaflet as it is loaded via CDN in index.html
declare const L: any;

interface MapViewProps {
  leads: Lead[];
}

// Global cache to prevent re-fetching coordinates for the same location string
const GEOCODE_CACHE: Record<string, { lat: number, lng: number }> = {};

const MapView: React.FC<MapViewProps> = ({ leads }) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [processedLeads, setProcessedLeads] = useState<Lead[]>([]);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // 1. Geocode Leads when they change
  useEffect(() => {
    let active = true;

    const geocodeLeads = async () => {
      const leadsToGeocode = leads.filter(l => !l.coordinates && l.location);
      const leadsWithCoords = leads.filter(l => l.coordinates);
      
      if (leadsToGeocode.length === 0) {
        setProcessedLeads(leads);
        return;
      }

      setIsGeocoding(true);
      setGeocodingProgress(0);
      
      const newProcessed = [...leadsWithCoords];
      
      // Process in sequence to respect Nominatim rate limit (1 req/sec)
      for (let i = 0; i < leadsToGeocode.length; i++) {
        if (!active) break;
        
        const lead = leadsToGeocode[i];
        const locationQuery = lead.location;

        if (GEOCODE_CACHE[locationQuery]) {
          newProcessed.push({ ...lead, coordinates: GEOCODE_CACHE[locationQuery] });
        } else {
          try {
            // Fetch from Nominatim (OpenStreetMap)
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`, {
                headers: { 'User-Agent': 'LeadGenius-AI-App' }
            });
            const data = await res.json();
            
            if (data && data.length > 0) {
              const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
              GEOCODE_CACHE[locationQuery] = coords;
              newProcessed.push({ ...lead, coordinates: coords });
            } else {
               // Fallback or leave as null
               newProcessed.push(lead);
            }
            // Rate limit delay
            await new Promise(r => setTimeout(r, 1100)); 
          } catch (e) {
            console.warn(`Geocoding failed for ${locationQuery}`, e);
            newProcessed.push(lead);
          }
        }
        
        setGeocodingProgress(i + 1);
        setProcessedLeads([...newProcessed]); // Update map incrementally
      }
      
      setIsGeocoding(false);
    };

    geocodeLeads();

    return () => { active = false; };
  }, [leads]);

  // 2. Initialize and Update Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Initialize map if not already done
    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current).setView([20, 0], 2);
      
      // Add dark mode friendly tile layer
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
        
      L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapRef.current);
    }

    // Clear existing markers
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Create custom icon
    const createCustomIcon = (industry: string) => {
      const colorClass = industry.includes('Tech') ? 'text-indigo-600' 
        : industry.includes('Finance') ? 'text-emerald-600'
        : 'text-rose-600';
        
      return L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: white; padding: 6px; border-radius: 50%; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 2px solid currentColor;" class="${colorClass}">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                   <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                   <circle cx="12" cy="10" r="3"/>
                 </svg>
               </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36]
      });
    };

    // Add markers for processed leads
    const validLeads = processedLeads.filter(l => l.coordinates && l.coordinates.lat && l.coordinates.lng);
    const bounds = L.latLngBounds([]);

    validLeads.forEach(lead => {
      if (!lead.coordinates) return;
      
      const popupContent = `
        <div style="font-family: sans-serif; min-width: 200px;">
          <h3 style="font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #0f172a;">${lead.company}</h3>
          <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">${lead.industry}</p>
          <p style="font-size: 12px; color: #475569; display: flex; align-items: center; gap: 4px; margin-bottom: 8px;">
            📍 ${lead.location}
          </p>
          <a href="${lead.googleMapsUrl}" target="_blank" style="font-size: 12px; color: #4f46e5; text-decoration: none; font-weight: 600;">
            View on Google Maps &rarr;
          </a>
        </div>
      `;

      L.marker([lead.coordinates.lat, lead.coordinates.lng], { icon: createCustomIcon(lead.industry) })
        .addTo(mapRef.current)
        .bindPopup(popupContent);
        
      bounds.extend([lead.coordinates.lat, lead.coordinates.lng]);
    });

    // Fit bounds only if we have new markers
    if (validLeads.length > 0) {
      mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

  }, [processedLeads]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) mapRef.current.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm relative z-0 flex flex-col">
      <div ref={mapContainerRef} className="flex-1 w-full bg-slate-100 dark:bg-slate-900" />
      
      {/* Geocoding Status Overlay */}
      {isGeocoding && (
         <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg z-[1000] border border-indigo-100 dark:border-indigo-900 flex items-center gap-3">
             <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
             <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
               Locating satellites... {geocodingProgress} / {leads.filter(l => !l.coordinates).length}
             </span>
         </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute bottom-6 left-6 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-xl shadow-xl z-[1000] border border-slate-200 dark:border-slate-700 max-w-xs">
         <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
               <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">{processedLeads.filter(l => l.coordinates).length} Located</span>
         </div>
         <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
           Using OpenStreetMap Geocoding for precision. Some addresses may be approximate.
         </p>
      </div>
    </div>
  );
};

export default MapView;
