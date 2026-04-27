import React, { useState, useEffect } from 'react';
import { Filter, Download, Droplets, HeartPulse, Refrigerator, Zap, MoreHorizontal, ArrowUpRight, CheckCircle2, MapPin } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, addDoc } from 'firebase/firestore';
import { Need } from '../types';
import { cn } from '../lib/utils';

export default function NeedsAnalysis() {
  const [needs, setNeeds] = useState<Need[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'needs'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const needsData: Need[] = [];
      snapshot.forEach((doc) => {
        needsData.push({ id: doc.id, ...doc.data() } as Need);
      });
      setNeeds(needsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'needs');
    });

    return () => unsubscribe();
  }, []);

  const confirmNeed = async (id: string, type: string) => {
    try {
      await updateDoc(doc(db, 'needs', id), { status: 'Confirmed' });
      await addDoc(collection(db, 'activities'), {
        type: 'need_flagged',
        description: `Resource need confirmed: ${type}`,
        details: `Updated via Needs Analysis panel`,
        timestamp: new Date().toISOString(),
        status: 'info'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `needs/${id}`);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-rose-600';
      case 'High': return 'bg-orange-600';
      case 'Medium': return 'bg-amber-500';
      default: return 'bg-emerald-500';
    }
  };

  const getIcon = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('water')) return Droplets;
    if (t.includes('med') || t.includes('health')) return HeartPulse;
    if (t.includes('food')) return Refrigerator;
    if (t.includes('power') || t.includes('elect')) return Zap;
    return MoreHorizontal;
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in fade-in duration-500 bg-slate-50 dark:bg-slate-950 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 sm:gap-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Needs Analysis</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Reviewing AI-extracted resource requirements from latest community surveys.</p>
        </div>
        <div className="flex w-full sm:w-auto gap-3">
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
            <Filter size={14} />
            Filter
          </button>
          <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 bg-slate-950 dark:bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-sm">
            <Download size={14} />
            Export All
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'TOTAL NEEDS', val: needs.length, change: '+12% from yesterday', icon: ArrowUpRight, color: 'blue' },
          { label: 'HIGH URGENCY', val: needs.filter(n => n.urgency === 'High' || n.urgency === 'Critical').length, sub: 'Requires immediate action', color: 'rose' },
          { label: 'PENDING REVIEW', val: needs.filter(n => n.status === 'Pending').length, sub: 'AI-processed, waiting confirmation', color: 'amber' },
          { label: 'EFFICIENCY', val: '94%', sub: 'AI Classification Accuracy', icon: CheckCircle2, color: 'emerald' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{stat.label}</span>
              {stat.icon && <stat.icon className={cn(
                "text-slate-400 dark:text-slate-500",
                stat.color === 'blue' ? "text-blue-500 dark:text-blue-400" :
                stat.color === 'rose' ? "text-rose-500 dark:text-rose-400" :
                stat.color === 'amber' ? "text-amber-500 dark:text-amber-400" : "text-emerald-500 dark:text-emerald-400"
              )} size={18} />}
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{stat.val}</h3>
            <p className={cn(
              "text-[10px] font-bold uppercase",
              stat.color === 'blue' ? "text-emerald-500 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500"
            )}>
              {stat.change || stat.sub}
            </p>
            <div className={cn(
              "absolute top-0 right-0 w-2 h-full",
              stat.color === 'blue' ? "bg-blue-500" :
              stat.color === 'rose' ? "bg-rose-500" :
              stat.color === 'amber' ? "bg-amber-500" : "bg-emerald-500"
            )} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium">Loading needs...</div>
        ) : needs.length === 0 ? (
          <div className="col-span-full py-20 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-center text-slate-400 dark:text-slate-500">
            No needs identified yet. Go to Upload & OCR to process surveys.
          </div>
        ) : needs.map((need) => {
          const Icon = getIcon(need.type);
          return (
            <div key={need.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col group transition-colors">
              <div className="p-6 pb-4 flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="p-3 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl group-hover:bg-rose-600 dark:group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                    <Icon size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{need.type}</h3>
                      <span className={cn(
                        "px-2 py-0.5 text-[8px] font-black uppercase text-white rounded-sm",
                        getUrgencyColor(need.urgency)
                      )}>
                        {need.urgency} URGENCY
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tight">
                      <MapPin size={12} />
                      {need.location}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                  <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 leading-none">Original Source Snippet</h5>
                  <p className="text-xs text-slate-600 dark:text-slate-400 italic font-medium leading-relaxed">
                    "{need.source_text}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100/50 dark:border-slate-700/50">
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Estimated Impact</h5>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{need.estimated_impact}</p>
                  </div>
                  <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100/50 dark:border-slate-700/50">
                    <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 leading-none">Resource Match</h5>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{need.resource_match}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 px-4 sm:px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">AI Confidence: {(need.ai_confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="flex w-full sm:w-auto gap-2">
                  <button className="flex-1 sm:flex-none px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    Edit
                  </button>
                  {need.status === 'Pending' ? (
                    <button 
                      onClick={() => confirmNeed(need.id!, need.type)}
                      className="flex-1 sm:flex-none px-6 py-2 bg-blue-600 dark:bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-blue-700 dark:hover:bg-indigo-500 transition-all shadow-sm"
                    >
                      Confirm
                    </button>
                  ) : (
                    <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-800">
                      <CheckCircle2 size={14} />
                      <span className="text-xs font-bold uppercase tracking-widest">{need.status}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-4 max-w-[calc(100vw-3rem)]">
          <div className="p-2 bg-blue-500 rounded-lg">
            <Zap size={20} className="animate-pulse" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Gemini Processing</h4>
            <p className="text-sm font-bold truncate max-w-[200px]">Analyzing 3 new survey uploads...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
