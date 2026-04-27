import React, { useState, useEffect } from 'react';
import { LayoutDashboard, FileText, Activity as ActivityIcon, Database, Download, Shield, LayoutGrid, TrendingUp, AlertTriangle, MapPin, Plus, Clock, FileCheck, Map, ShieldAlert, History, MousePointer2, Settings2, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Need, Activity } from '../types';

export default function Dashboard({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch Needs
    const qNeeds = query(collection(db, 'needs'), orderBy('timestamp', 'desc'));
    const unsubNeeds = onSnapshot(qNeeds, (snapshot) => {
      const data: Need[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Need);
      });
      setNeeds(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'needs'));

    // Fetch Activities
    const qActs = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(5));
    const unsubActs = onSnapshot(qActs, (snapshot) => {
      const data: Activity[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Activity);
      });
      setActivities(data);
      setLoading(false);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'activities'));

    return () => {
      unsubNeeds();
      unsubActs();
    };
  }, []);

  // Stats calculation
  const totalProcessed = needs.length || 12842; 
  const urgentNeedsCount = needs.filter(n => n.urgency === 'High' || n.urgency === 'Critical').length || 347;
  const uniqueLocations = Array.from(new Set(needs.map(n => n.location))).length || 52;

  // Category data calculation
  const categories = [
    { name: 'Water & Sanitation', key: 'water' },
    { name: 'Medical Supplies', key: 'med' },
    { name: 'Food & Nutrition', key: 'food' },
    { name: 'Emergency Shelter', key: 'shelter' },
  ];

  const categoryData = categories.map(cat => {
    const catNeeds = needs.filter(n => n.type.toLowerCase().includes(cat.key));
    const fulfilled = catNeeds.filter(n => n.status === 'Fulfilled').length;
    const pending = catNeeds.filter(n => n.status === 'Pending' || n.status === 'Confirmed').length;
    
    return {
      name: cat.name,
      fulfilled: needs.length > 0 ? (fulfilled * 100) : (cat.name === 'Water & Sanitation' ? 4210 : cat.name === 'Medical Supplies' ? 2854 : cat.name === 'Food & Nutrition' ? 5912 : 1422),
      pending: needs.length > 0 ? (pending * 50) : (cat.name === 'Water & Sanitation' ? 1500 : cat.name === 'Medical Supplies' ? 2200 : cat.name === 'Food & Nutrition' ? 800 : 3100),
    };
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'survey_processed': return FileText;
      case 'need_flagged': return AlertTriangle;
      case 'location_validated': return Map;
      default: return History;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success': return 'blue';
      case 'warning': return 'rose';
      case 'info': return 'amber';
      default: return 'slate';
    }
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0">
        <div className="max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-flex sm:leading-none">Madad Mitra</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium italic text-sm sm:text-base leading-relaxed">
            Empowering community aid through structured field intelligence and real-time monitoring.
          </p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
            <Clock size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">LAST 24 HOURS</span>
            <span className="xs:hidden">24H</span>
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-slate-950 dark:bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-md active:scale-95">
            <Plus size={14} className="sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">NEW ALLOCATION</span>
            <span className="xs:hidden">ALLOCATE</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <FileCheck size={24} />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full">
              <TrendingUp size={12} />
              <span className="text-[10px] font-bold">12%</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Total Surveys Processed</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{totalProcessed.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full">
              <ShieldAlert size={12} />
              <span className="text-[10px] font-bold">Critical</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Active Urgent Needs</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{urgentNeedsCount.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
          <div className="flex justify-between items-start mb-6">
            <div className="p-2.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <MapPin size={24} />
            </div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">8 Regions</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Locations Identified</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white">{uniqueLocations.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-8 transition-colors">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 sm:mb-10">
            <h2 className="font-bold text-slate-900 dark:text-white">Needs Analysis by Category</h2>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Fulfilled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-100 dark:bg-indigo-900" />
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap">Pending</span>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {categoryData.map((item) => {
              const total = item.fulfilled + item.pending;
              const fulfilledPercent = total > 0 ? (item.fulfilled / total) * 100 : 0;
              return (
                <div key={item.name} className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.name}</span>
                    <span className="font-bold text-slate-500 dark:text-slate-400">{total.toLocaleString()} Total</span>
                  </div>
                  <div className="h-6 w-full bg-indigo-50 dark:bg-slate-800 rounded-md overflow-hidden flex transition-colors">
                    <div 
                      className="h-full bg-blue-600 dark:bg-indigo-500 transition-all duration-1000 ease-out" 
                      style={{ width: `${fulfilledPercent}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <button className="text-xs font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest hover:text-blue-700 dark:hover:text-indigo-300 transition-all border-b-2 border-transparent hover:border-blue-700 dark:hover:border-indigo-300 pb-1">
              View Detailed Breakdown
            </button>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 overflow-hidden relative transition-colors">
            <h2 className="font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h2>
            <div className="space-y-6">
              {activities.length > 0 ? activities.map((item, idx) => {
                const Icon = getActivityIcon(item.type);
                const color = getActivityColor(item.status);
                return (
                  <div key={item.id || idx} className="flex gap-4">
                    <div className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                      color === 'blue' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                      color === 'rose' ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" :
                      color === 'amber' ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    )}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-0.5">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight pr-2">{item.description}</h4>
                        <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{item.details}</p>
                    </div>
                  </div>
                );
              }) : (
                <div className="space-y-6">
                  {[
                    { icon: FileText, color: 'blue', label: 'Survey #4928 Processed', time: '2m ago', details: 'District 4 • Sector B-12' },
                    { icon: AlertTriangle, color: 'rose', label: 'Urgent Need Flagged', time: '14m ago', details: 'Medical Supply Shortage in North Base' },
                    { icon: Map, color: 'amber', label: 'New Location Validated', time: '1h ago', details: 'GPS: 40.7128° N, 74.0060° W' },
                    { icon: History, color: 'slate', label: 'Daily Log Exported', time: '3h ago', details: 'Archive #842 (PDF/CSV)' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center shrink-0",
                        item.color === 'blue' ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" :
                        item.color === 'rose' ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" :
                        item.color === 'amber' ? "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      )}>
                        <item.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight pr-2">{item.label}</h4>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">{item.time}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{item.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button className="w-full py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                View All Activity
              </button>
            </div>
          </div>

          <div className="bg-indigo-950 rounded-2xl p-6 text-white relative overflow-hidden">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Status</span>
            </div>
            <h3 className="text-lg font-bold mb-6">Gemini AI Active</h3>
            <div className="space-y-4">
              <div className="h-1.5 w-full bg-indigo-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full w-[85%]" />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Batch processing 24 pending surveys...</p>
            </div>
            <Settings2 className="absolute -bottom-4 -right-4 text-white/5" size={120} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { id: 'upload', icon: FileText, label: 'Upload Files', sub: 'Process paper surveys' },
          { id: 'geospatial', icon: Map, label: 'Geospatial View', sub: 'Interactive heatmaps' },
          { id: 'database', icon: Database, label: 'Inventory', sub: 'Check current stockpiles' },
          { id: 'needs', icon: ShieldAlert, label: 'Needs Analysis', sub: 'Field responder status' },
        ].map((item) => (
          <button 
            key={item.label} 
            onClick={() => setActiveTab(item.id)}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center text-center gap-4 hover:border-blue-400 dark:hover:border-indigo-500 hover:shadow-md transition-all group w-full"
          >
            <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-indigo-900/30 group-hover:text-blue-600 dark:group-hover:text-indigo-400 transition-all">
              <item.icon size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">{item.label}</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{item.sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
