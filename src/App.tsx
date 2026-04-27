/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/Upload';
import NeedsAnalysis from './pages/NeedsAnalysis';
import ResourceDatabase from './pages/ResourceDatabase';
import GeospatialView from './pages/GeospatialView';
import { auth, signIn } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { LayoutGrid, ShieldCheck, Menu } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 gap-4 transition-colors">
        <div className="p-4 bg-indigo-950 rounded-2xl text-white animate-bounce shadow-xl shadow-indigo-900/20">
          <LayoutGrid size={48} />
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs animate-pulse">Initializing System...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-8 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center flex-col items-center gap-6">
            <div className="p-6 bg-indigo-950 dark:bg-indigo-600 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50">
              <LayoutGrid size={64} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Madad Mitra</h1>
              <p className="text-slate-500 dark:text-indigo-400 font-bold uppercase tracking-widest text-[10px] mt-1 text-indigo-900">Assistance Friend</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Welcome to the Madad Mitra crisis response platform. Please sign in with your administrative account to access the oversight dashboard and real-time field intelligence.
            </p>
            <button 
              onClick={signIn}
              className="w-full py-4 bg-slate-950 dark:bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-indigo-500 transition-all shadow-lg active:scale-[0.98]"
            >
              <ShieldCheck size={20} />
              Sign in with administrative account
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-[0.2em]">Oversight Dept. • Authorised Access Only</p>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'upload': return <UploadPage />;
      case 'needs': return <NeedsAnalysis />;
      case 'database': return <ResourceDatabase />;
      case 'geospatial': return <GeospatialView />;
      default: return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans selection:bg-blue-100 dark:selection:bg-indigo-900/30 selection:text-blue-900 dark:selection:text-indigo-200 transition-colors">
      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={cn(
        "fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 transform transition-transform duration-300 lg:translate-x-0 w-64 h-full",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <Sidebar activeTab={activeTab} setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 transition-colors">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

