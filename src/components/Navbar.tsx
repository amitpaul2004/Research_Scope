import React, { useState } from 'react';
import {
  Search,
  Bell,
  Sparkles,
  FileText,
  Workflow,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react';
import { NotificationItem, User } from '../types';

interface NavbarProps {
  user: User | null;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenNotifications: () => void;
  onNavigate: (view: string) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  unreadCount,
  onOpenNotifications,
  onNavigate,
  globalSearch,
  setGlobalSearch,
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-blue-600 to-indigo-800 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/35 transition-all">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950/40">
                <svg className="w-5 h-5 text-indigo-300" viewBox="0 0 32 32" fill="none">
                  <circle cx="13" cy="13" r="9" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M20 20L28 28" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  <path d="M9 10H17M9 13H15M9 16H13" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="21" cy="7" r="2.5" fill="#38bdf8" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-lg text-slate-100 group-hover:text-white transition-colors">
                  Research<span className="text-indigo-400">Lens</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  AI SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                Research Intelligence &amp; Automation Platform
              </p>
            </div>
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search papers, hypotheses, concepts, or DOIs..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              className="w-full rounded-lg bg-slate-900/90 border border-slate-800 pl-10 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500/60 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all"
            />
          </div>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-2.5">
          {/* Quick Context Launcher */}
          <button
            onClick={() => onNavigate('context')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Explore Context</span>
          </button>

          {/* n8n Automation status indicator */}
          <button
            onClick={() => onNavigate('automation')}
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700 transition-colors"
            title="n8n Automation Engine"
          >
            <Workflow className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px]">n8n Automation</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-slate-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all text-left"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-900/60 border border-indigo-700/50 text-indigo-200 text-xs font-semibold">
                {user ? user.name.slice(0, 2).toUpperCase() : 'ER'}
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-medium text-slate-200 leading-tight">
                  {user?.name || 'Dr. Elena Rostova'}
                </p>
                <p className="text-[10px] text-slate-400 leading-none">
                  Principal Investigator
                </p>
              </div>
              <ChevronDown className="w-3 h-3 text-slate-500 hidden xl:block" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-xl shadow-black/50 py-1 z-50 text-xs text-slate-300 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="font-semibold text-slate-100">{user?.name || 'Elena Rostova'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email || 'pal900290@gmail.com'}</p>
                  <p className="text-[10px] text-indigo-400 mt-0.5">{user?.institution || 'Center for Advanced Research'}</p>
                </div>
                <button
                  onClick={() => {
                    onNavigate('dashboard');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  Research Workspace
                </button>
                <button
                  onClick={() => {
                    onNavigate('automation');
                    setShowProfileMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-slate-800/80 flex items-center gap-2"
                >
                  <Workflow className="w-3.5 h-3.5 text-slate-400" />
                  n8n Automation Settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
