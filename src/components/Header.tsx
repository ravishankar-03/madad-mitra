import React, { useState } from 'react';
import { Search, Bell, Settings, HelpCircle, User, Sparkles, LogOut, Moon, Sun, Menu } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { useTheme } from '../lib/ThemeContext';
import SmartIntakeModal from './SmartIntakeModal';

export default function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const user = auth.currentUser;
  const { theme, toggleTheme } = useTheme();
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
        <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-xl">
          <button 
            onClick={toggleSidebar}
            className="p-2 lg:hidden text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <Menu size={20} />
          </button>
          
          <div className="relative w-full flex items-center gap-2 md:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-indigo-500 focus:border-transparent transition-all dark:text-white"
              />
            </div>
            <button 
              onClick={() => setIsIntakeOpen(true)}
              className="flex items-center gap-2 px-2 md:px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-300 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shrink-0 shadow-sm"
            >
              <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
              <span className="hidden xs:inline">Smart Intake AI</span>
              <span className="xs:hidden">Intake</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6 ml-4">
          <div className="flex items-center gap-2 md:gap-4 text-slate-500 dark:text-slate-400 md:pr-6 md:border-r border-slate-200 dark:border-slate-800">
            <button 
              onClick={toggleTheme}
              className="p-2 hover:text-slate-900 dark:hover:text-white transition-colors"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button className="hidden sm:block p-2 hover:text-slate-900 dark:hover:text-white transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-900"></span>
            </button>
            <button className="hidden md:block p-2 hover:text-slate-900 dark:hover:text-white transition-colors"><Settings size={20} /></button>
            <button className="hidden lg:block p-2 hover:text-slate-900 dark:hover:text-white transition-colors"><HelpCircle size={20} /></button>
            <button 
              onClick={handleLogout}
              className="p-2 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex items-center gap-2"
              title="Log Out"
            >
              <LogOut size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.displayName || 'Admin User'}</p>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Oversight Dept.</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-800">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="User" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-indigo-950 text-white">
                  <User size={20} />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <SmartIntakeModal 
        isOpen={isIntakeOpen} 
        onClose={() => setIsIntakeOpen(false)}
        onSuccess={(count) => {
          console.log(`Successfully processed ${count} needs`);
        }}
      />
    </>
  );
}
