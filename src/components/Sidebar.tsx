import React from 'react';
import { LayoutDashboard, FileText, Activity as ActivityIcon, Database, Download, Shield, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'upload', icon: FileText, label: 'Upload & OCR' },
    { id: 'geospatial', icon: ActivityIcon, label: 'Geospatial View' },
    { id: 'needs', icon: ActivityIcon, label: 'Needs Analysis' },
    { id: 'database', icon: Database, label: 'Resource Database' },
  ];

  const adminItems = [
    { id: 'logs', icon: Download, label: 'Export Logs' },
    { id: 'security', icon: Shield, label: 'Security' },
  ];

  return (
    <div className="w-full h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col pt-6 transition-colors">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="p-2 bg-indigo-950 dark:bg-indigo-600 rounded-lg text-white">
          <LayoutGrid size={24} />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white leading-tight">Madad Mitra</h1>
          <h2 className="text-[10px] font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest leading-tight">Assistance Friend</h2>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
              activeTab === item.id 
                ? "bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-l-4 border-slate-900 dark:border-indigo-500" 
                : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            <item.icon size={20} className={activeTab === item.id ? "text-slate-900 dark:text-white" : "text-slate-400"} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="px-4 py-8 space-y-1 border-t border-slate-100 dark:border-slate-800">
        {adminItems.map((item) => (
          <button
            key={item.id}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
          >
            <item.icon size={20} className="text-slate-400" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
