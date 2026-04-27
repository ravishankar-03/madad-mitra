import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Need } from '../types';
import { Filter, Layers, Info, Maximize2, Crosshair } from 'lucide-react';
import { cn } from '../lib/utils';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Urgency mapping to colors
const URGENCY_COLORS = {
  'Critical': '#dc2626', // Red
  'High': '#ea580c',     // Orange
  'Medium': '#eab308',   // Yellow
  'Low': '#22c55e',      // Light Green
  'Very Low': '#16a34a'   // Dark Green
};

// Heatmap Layer Component
function HeatLayer({ points }: { points: [number, number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    // @ts-ignore - leaflet.heat adds this method
    const heatLayer = L.heatLayer(points, {
      radius: 40,
      blur: 20,
      maxZoom: 15,
      gradient: {
        0.2: '#16a34a', // Very Low
        0.4: '#22c55e', // Low
        0.6: '#eab308', // Medium
        0.8: '#ea580c', // High
        1.0: '#dc2626'  // Critical
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points]);

  return null;
}

export default function GeospatialView() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [center] = useState<[number, number]>([23.2599, 77.4126]); // Bhopal region

  useEffect(() => {
    const q = query(collection(db, 'needs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const needsData: Need[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Need;
        // Generate mock coordinates around Bhopal if missing
        if (!data.lat || !data.lng) {
          data.lat = 23.2599 + (Math.random() - 0.5) * 0.8;
          data.lng = 77.4126 + (Math.random() - 0.5) * 0.8;
        }
        needsData.push({ id: doc.id, ...data } as Need);
      });
      setNeeds(needsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'needs');
    });

    return () => unsubscribe();
  }, []);

  const heatPoints: [number, number, number][] = needs.map(need => [
    need.lat || 0,
    need.lng || 0,
    need.urgency === 'Critical' ? 1.0 :
    need.urgency === 'High' ? 0.75 :
    need.urgency === 'Medium' ? 0.5 : 0.25
  ]);

  const createClusterCustomIcon = useCallback((cluster: any) => {
    const markers = cluster.getAllChildMarkers();
    const count = markers.length;
    
    // Determine cluster characteristic urgency (average)
    let totalScore = 0;
    markers.forEach((m: any) => {
      const urgency = m.options.alt || 'Low';
      if (urgency === 'Critical') totalScore += 4;
      else if (urgency === 'High') totalScore += 3;
      else if (urgency === 'Medium') totalScore += 2;
      else totalScore += 1;
    });
    
    const avgScore = totalScore / count;
    let bgColor = URGENCY_COLORS['Low'];
    if (avgScore > 3.2) bgColor = URGENCY_COLORS['Critical'];
    else if (avgScore > 2.5) bgColor = URGENCY_COLORS['High'];
    else if (avgScore > 1.8) bgColor = URGENCY_COLORS['Medium'];

    return L.divIcon({
      html: `<div style="background-color: ${bgColor}" class="flex items-center justify-center rounded-full border-2 border-white/50 shadow-lg text-white font-black text-sm w-10 h-10 transition-transform hover:scale-110">
        <span>${count}</span>
      </div>`,
      className: 'custom-marker-cluster',
      iconSize: L.point(40, 40, true),
    });
  }, []);

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col animate-in fade-in duration-700 bg-[#f8f9fa]">
      {/* Header section matching your image style */}
      <div className="bg-white border-b border-slate-200 p-3 px-4 sm:px-6 flex justify-between items-center z-20 shadow-sm transition-colors">
        <h1 className="text-sm sm:text-lg font-semibold text-slate-800 truncate pr-4">Need Heatmap (Urgency Index)</h1>
        <button className="whitespace-nowrap px-3 sm:px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-[10px] sm:text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
          View Full Map
        </button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <MapContainer 
          center={center} 
          zoom={9} 
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.osm.org/{z}/{x}/{y}.png"
          />
          
          {showHeatmap && <HeatLayer points={heatPoints} />}
          
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={50}
            showCoverageOnHover={false}
          >
            {needs.map((need, idx) => (
              <Marker 
                key={need.id || idx} 
                position={[need.lat || 0, need.lng || 0]}
                alt={need.urgency}
              >
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[180px]">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-900 text-xs truncate">{need.type}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded-[2px] text-[8px] font-black uppercase text-white shrink-0",
                        need.urgency === 'Critical' ? 'bg-red-600' :
                        need.urgency === 'High' ? 'bg-orange-600' : 
                        need.urgency === 'Medium' ? 'bg-yellow-500' : 'bg-green-600'
                      )}>
                        {need.urgency}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic mb-2">"{need.source_text}"</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{need.location}</p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Floating Urgency Index Legend (Bottom Left) */}
        <div className="absolute bottom-4 sm:bottom-10 left-4 sm:left-6 z-[400] bg-white/95 backdrop-blur shadow-2xl rounded-xl p-3 sm:p-5 border border-slate-100 min-w-[140px] sm:min-w-[180px] transition-all">
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 mb-2 sm:mb-4 tracking-tight">Urgency Index</h4>
          <div className="space-y-2 sm:space-y-3">
            {[
              { label: 'Very High', color: 'bg-red-600' },
              { label: 'High', color: 'bg-orange-600' },
              { label: 'Medium', color: 'bg-yellow-400' },
              { label: 'Low', color: 'bg-green-500' },
              { label: 'Very Low', color: 'bg-green-600' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 sm:gap-3">
                <div className={cn("w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-inner", item.color)} />
                <span className="text-[9px] sm:text-[11px] font-semibold text-slate-600">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating Toggle Controls */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-[400] flex flex-col gap-2 sm:gap-3">
          <div className="bg-white/95 backdrop-blur p-1 rounded-xl shadow-xl flex border border-slate-100">
            <button 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={cn(
                "px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                showHeatmap ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Heatmap
            </button>
            <button 
              className="hidden sm:block px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg text-slate-500 hover:bg-slate-50"
            >
              Filters
            </button>
          </div>
          
          <div className="flex flex-col gap-2">
            {[Maximize2, Crosshair, Info].map((Icon, i) => (
              <button key={i} className="p-2 sm:p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-xl shadow-lg border border-slate-100 transition-all active:scale-95">
                <Icon size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics overlay footer */}
      <div className="bg-white border-t border-slate-200 p-3 sm:p-4 px-4 sm:px-8 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0 transition-all">
        <div className="flex gap-8 sm:gap-12 w-full sm:w-auto justify-around sm:justify-start">
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Impact Points</span>
            <span className="text-lg sm:text-xl font-bold text-slate-800">{needs.length} <span className="text-[10px] sm:text-xs font-medium text-slate-400 ml-1">Total</span></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Critical Zones</span>
            <span className="text-lg sm:text-xl font-bold text-red-600">{needs.filter(n => n.urgency === 'Critical').length} <span className="text-[10px] sm:text-xs font-medium text-slate-400 ml-1">Active</span></span>
          </div>
        </div>
        <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-tighter cursor-pointer hover:bg-blue-100 transition-all">
          <Layers size={14} />
          View Sector Reports
        </div>
      </div>
    </div>
  );
}
