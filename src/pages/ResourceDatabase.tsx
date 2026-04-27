import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Need } from '../types';
import { Filter, Download, Plus, Search, ChevronRight, ChevronLeft, Info, Activity, Bell, Settings, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';

export default function ResourceDatabase() {
  const [records, setRecords] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'needs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Need[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Need);
      });
      setRecords(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'needs');
    });

    return () => unsubscribe();
  }, []);

  const urgencyDistribution = [
    { name: 'Critical', val: 85, color: '#e11d48' },
    { name: 'Moderate', val: 45, color: '#f59e0b' },
    { name: 'Stable', val: 65, color: '#10b981' },
    { name: 'Closed', val: 30, color: '#334155' },
  ];

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in slide-in-from-right-4 duration-500 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">ResourceAlloc AI</h1>
          <p className="text-[10px] sm:text-sm font-medium text-slate-500 dark:text-slate-400 inline-flex items-center gap-2 mt-1">
            <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
            Resource Database
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-slate-500 dark:text-slate-400">
          <button className="hidden xs:block hover:text-slate-900 dark:hover:text-white transition-colors"><Bell size={20} /></button>
          <button className="hidden sm:block hover:text-slate-900 dark:hover:text-white transition-colors"><Settings size={20} /></button>
          <button className="hover:text-slate-900 dark:hover:text-white transition-colors"><HelpCircle size={20} /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Processed Records</h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">Managing {records.length.toLocaleString()} verified resource requests from Firestore clusters.</p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Filters:</span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 sm:px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-bold rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                  Urgency: High
                  <button className="hover:text-blue-800 dark:hover:text-blue-200">×</button>
                </span>
                <span className="px-2 sm:px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] sm:text-[10px] font-bold rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-2">
                  Type: Medical
                  <button className="hover:text-blue-800 dark:hover:text-blue-200">×</button>
                </span>
                <button className="text-[9px] sm:text-[10px] font-bold text-blue-600 dark:text-indigo-400 uppercase tracking-widest hover:underline ml-1 transition-all whitespace-nowrap">Clear All</button>
              </div>
            </div>
            
            <div className="flex w-full sm:w-auto items-center gap-2 sm:gap-3">
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <Filter size={14} className="sm:w-4 sm:h-4" />
                Filter
              </button>
              <button className="hidden sm:flex flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                <Download size={16} />
                Export
              </button>
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-slate-950 dark:bg-indigo-600 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-sm">
                <Plus size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Manual Entry</span>
                <span className="xs:hidden">New</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                <th className="p-6 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800" /></th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">ID</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Type</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Urgency</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Location</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="p-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Source Text</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-600">Loading records...</td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={7} className="p-12 text-center text-slate-400 dark:text-slate-600 font-medium">No verified records found.</td></tr>
              ) : records.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="p-6 w-12"><input type="checkbox" className="rounded border-slate-300 dark:border-slate-700 dark:bg-slate-800" /></td>
                  <td className="p-6">
                    <span className="text-xs font-bold text-blue-600 dark:text-indigo-400 hover:underline cursor-pointer">#RES-{record.id?.slice(-4).toUpperCase()}</span>
                  </td>
                  <td className="p-6 text-sm font-bold text-slate-800 dark:text-slate-200">{record.type}</td>
                  <td className="p-6">
                    <span className={cn(
                      "px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border",
                      record.urgency === 'Critical' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50" :
                      record.urgency === 'High' ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/50" :
                      record.urgency === 'Medium' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                    )}>
                      {record.urgency}
                    </span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 dark:group-hover:bg-indigo-500 transition-colors" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{record.location}</span>
                    </div>
                  </td>
                  <td className="p-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {record.timestamp ? (isNaN(new Date(record.timestamp).getTime()) ? 'Invalid Date' : format(new Date(record.timestamp), 'yyyy-MM-dd HH:mm')) : 'N/A'}
                  </td>
                  <td className="p-6 max-w-xs">
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate italic font-medium leading-relaxed">"{record.source_text}"</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 flex flex-col sm:flex-row items-center justify-between gap-4 transition-colors">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center sm:text-left">Showing 1 to {records.length} of {records.length} records</p>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Rows:</span>
              <select className="bg-transparent text-[10px] font-bold text-slate-700 dark:text-slate-300 outline-none">
                <option>50</option>
                <option>100</option>
              </select>
            </div>
            <div className="flex gap-1">
              <button className="p-1 px-2 border border-slate-200 dark:border-slate-800 rounded text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all"><ChevronLeft size={16} /></button>
              <button className="p-1 px-3 bg-slate-900 dark:bg-indigo-600 text-white rounded text-[10px] font-bold">1</button>
              <button className="hidden xs:block p-1 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[10px] font-bold dark:text-slate-300">2</button>
              <button className="hidden sm:block p-1 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[10px] font-bold dark:text-slate-300">3</button>
              <span className="px-2 text-slate-400 dark:text-slate-600">...</span>
              <button className="p-1 px-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-[10px] font-bold dark:text-slate-300">25</button>
              <button className="p-1 px-2 border border-slate-200 dark:border-slate-800 rounded text-slate-400 dark:text-slate-600 hover:text-slate-900 dark:hover:text-white transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm p-8 transition-colors">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Regional Urgency Distribution</h2>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">AI-processed severity levels by geographical sector.</p>
            </div>
            <Info size={18} className="text-slate-300 dark:text-slate-600" />
          </div>

          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={urgencyDistribution} barGap={0} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} dy={10} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 text-white p-2 rounded text-[10px] font-bold shadow-xl">
                          {payload[0].value}% {payload[0].payload.name}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar 
                  dataKey="val" 
                  radius={[4, 4, 0, 0]} 
                  barSize={120}
                >
                  {urgencyDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#131b2e] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-6">
            <Activity className="text-blue-400" size={32} />
            <div>
              <h3 className="text-lg font-bold mb-2">AI Optimization Active</h3>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                Gemini is currently re-indexing 420 recent surveys to update the database urgency scores.
              </p>
            </div>
          </div>
          
          <div className="space-y-3 pt-12 relative z-10">
            <div className="flex justify-between items-end">
              <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-400">Processing Pipeline</span>
              <span className="text-sm font-black">72%</span>
            </div>
            <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-white w-[72%] transition-all duration-1000 animate-pulse" />
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-16 -mt-16" />
        </div>
      </div>
    </div>
  );
}
