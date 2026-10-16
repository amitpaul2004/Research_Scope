import React, { useState, useMemo } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink,
  Filter,
  RotateCcw,
  Sparkles,
  FileText,
  FileCheck,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { NotificationItem } from '../types';

export type NotificationFilterType =
  | 'all'
  | 'unread'
  | 'success'
  | 'warning'
  | 'error'
  | 'ai_analysis'
  | 'pdf_export'
  | 'paper';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (view: string) => void;
  onRefreshNotifications?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
  onRefreshNotifications,
}) => {
  const [activeFilter, setActiveFilter] = useState<NotificationFilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filterCounts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      success: notifications.filter(n => n.type === 'success').length,
      warning: notifications.filter(n => n.type === 'warning').length,
      error: notifications.filter(n => n.type === 'error').length,
      ai_analysis: notifications.filter(
        n =>
          n.category === 'ai_analysis' ||
          n.title.toLowerCase().includes('ai') ||
          n.message.toLowerCase().includes('stylometric') ||
          n.message.toLowerCase().includes('ai likelihood')
      ).length,
      pdf_export: notifications.filter(
        n =>
          n.category === 'pdf_export' ||
          n.title.toLowerCase().includes('export') ||
          n.title.toLowerCase().includes('pdf') ||
          n.message.toLowerCase().includes('highlighted pdf') ||
          n.message.toLowerCase().includes('original pdf')
      ).length,
      paper: notifications.filter(
        n =>
          n.category === 'paper' ||
          n.title.toLowerCase().includes('paper')
      ).length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          (n.category && n.category.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      if (activeFilter === 'all') return true;
      if (activeFilter === 'unread') return !n.read;
      if (activeFilter === 'success') return n.type === 'success';
      if (activeFilter === 'warning') return n.type === 'warning';
      if (activeFilter === 'error') return n.type === 'error';
      if (activeFilter === 'ai_analysis') {
        return (
          n.category === 'ai_analysis' ||
          n.title.toLowerCase().includes('ai') ||
          n.message.toLowerCase().includes('stylometric') ||
          n.message.toLowerCase().includes('ai likelihood')
        );
      }
      if (activeFilter === 'pdf_export') {
        return (
          n.category === 'pdf_export' ||
          n.title.toLowerCase().includes('export') ||
          n.title.toLowerCase().includes('pdf') ||
          n.message.toLowerCase().includes('highlighted pdf') ||
          n.message.toLowerCase().includes('original pdf')
        );
      }
      if (activeFilter === 'paper') {
        return (
          n.category === 'paper' ||
          n.title.toLowerCase().includes('paper')
        );
      }
      return true;
    });
  }, [notifications, activeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Notifications Center</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {notifications.filter(n => !n.read).length} Unread
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Pill Tabs Bar */}
        <div className="py-2.5 border-b border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-500" />
              <span>Filter by Type:</span>
            </div>
            {activeFilter !== 'all' && (
              <button
                onClick={() => setActiveFilter('all')}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer font-medium"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Reset Filter</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications by title, paper, or message..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            {/* All */}
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <span>All</span>
              <span className="text-[9px] opacity-75">({filterCounts.all})</span>
            </button>

            {/* Unread */}
            <button
              onClick={() => setActiveFilter('unread')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'unread'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-950 border border-slate-800 text-indigo-400 hover:text-indigo-300'
              }`}
            >
              <Bell className="w-2.5 h-2.5" />
              <span>Unread</span>
              <span className="text-[9px] opacity-75">({filterCounts.unread})</span>
            </button>

            {/* Success */}
            <button
              onClick={() => setActiveFilter('success')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'success'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
              <span>Success</span>
              <span className="text-[9px] opacity-75">({filterCounts.success})</span>
            </button>

            {/* Warning */}
            <button
              onClick={() => setActiveFilter('warning')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'warning'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
              <span>Warning</span>
              <span className="text-[9px] opacity-75">({filterCounts.warning})</span>
            </button>

            {/* Error */}
            <button
              onClick={() => setActiveFilter('error')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'error'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <AlertCircle className="w-2.5 h-2.5 text-rose-400" />
              <span>Error</span>
              <span className="text-[9px] opacity-75">({filterCounts.error})</span>
            </button>

            {/* AI Analysis */}
            <button
              onClick={() => setActiveFilter('ai_analysis')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'ai_analysis'
                  ? 'bg-purple-950 text-purple-300 border border-purple-800'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-2.5 h-2.5 text-purple-400" />
              <span>AI Analysis</span>
              <span className="text-[9px] opacity-75">({filterCounts.ai_analysis})</span>
            </button>

            {/* PDF Export */}
            <button
              onClick={() => setActiveFilter('pdf_export')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'pdf_export'
                  ? 'bg-blue-950 text-blue-300 border border-blue-800'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck className="w-2.5 h-2.5 text-blue-400" />
              <span>PDF Export</span>
              <span className="text-[9px] opacity-75">({filterCounts.pdf_export})</span>
            </button>

            {/* Paper Processing */}
            <button
              onClick={() => setActiveFilter('paper')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                activeFilter === 'paper'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-2.5 h-2.5 text-indigo-400" />
              <span>Paper Processing</span>
              <span className="text-[9px] opacity-75">({filterCounts.paper})</span>
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl my-4">
              <p>No notifications match the filter "{activeFilter}".</p>
              {activeFilter !== 'all' && (
                <button
                  onClick={() => setActiveFilter('all')}
                  className="mt-2 text-indigo-400 hover:text-indigo-300 underline font-medium"
                >
                  View all notifications ({notifications.length})
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkRead(notif.id);
                  if (notif.category === 'ai_analysis') onNavigate('detector');
                  else if (notif.category === 'pdf_export' || notif.category === 'paper') onNavigate('papers');
                  else if (notif.category === 'gap') onNavigate('gaps');
                  else if (notif.category === 'digest' || notif.category === 'automation') onNavigate('automation');
                  else if (notif.category === 'discovery') onNavigate('context');
                  onClose();
                }}
                className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
                    : notif.type === 'error'
                    ? 'bg-rose-950/20 border-rose-800/50 text-slate-200 shadow-sm hover:border-rose-700'
                    : notif.type === 'warning'
                    ? 'bg-amber-950/20 border-amber-800/50 text-slate-200 shadow-sm hover:border-amber-700'
                    : notif.category === 'pdf_export'
                    ? 'bg-blue-950/20 border-blue-800/40 text-slate-200 shadow-sm hover:border-blue-700'
                    : notif.category === 'ai_analysis'
                    ? 'bg-purple-950/20 border-purple-800/40 text-slate-200 shadow-sm hover:border-purple-700'
                    : 'bg-indigo-950/20 border-indigo-800/40 text-slate-200 shadow-sm hover:border-indigo-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                    {notif.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {notif.type === 'info' && <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    {notif.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    {notif.type === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                    <span>{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] text-slate-500">
                  <span className="capitalize px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400">
                    {notif.category ? notif.category.replace('_', ' ') : 'General'}
                  </span>
                  <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
