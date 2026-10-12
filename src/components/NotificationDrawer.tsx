import React from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (view: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 p-5 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onMarkAllRead}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Mark all read
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  onMarkRead(notif.id);
                  if (notif.category === 'paper') onNavigate('papers');
                  if (notif.category === 'gap') onNavigate('gaps');
                  if (notif.category === 'digest' || notif.category === 'automation') onNavigate('automation');
                  if (notif.category === 'discovery') onNavigate('context');
                  onClose();
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  notif.read
                    ? 'bg-slate-950/40 border-slate-800/60 text-slate-400'
                    : 'bg-indigo-950/20 border-indigo-800/40 text-slate-200 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-white">
                    {notif.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {notif.type === 'info' && <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                    {notif.type === 'warning' && <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                    <span>{notif.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                  {notif.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
