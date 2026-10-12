import React from 'react';
import {
  LayoutDashboard,
  Sparkles,
  FileText,
  ShieldAlert,
  GitCompare,
  Lightbulb,
  Compass,
  PenTool,
  Workflow,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  paperCount: number;
  gapCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  collapsed,
  setCollapsed,
  paperCount,
  gapCount,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Research Hub',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'context',
      label: 'Context Explorer',
      icon: Sparkles,
      badge: 'No PDF',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    },
    {
      id: 'papers',
      label: 'Paper Intelligence',
      icon: FileText,
      badge: paperCount > 0 ? `${paperCount}` : null,
      badgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    },
    {
      id: 'detector',
      label: 'AI Content Likelihood',
      icon: ShieldAlert,
      badge: 'Stylometric',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-800',
    },
    {
      id: 'compare',
      label: 'Paper Comparison',
      icon: GitCompare,
      badge: null,
    },
    {
      id: 'gaps',
      label: 'Research Gap Finder',
      icon: Lightbulb,
      badge: gapCount > 0 ? `${gapCount}` : null,
      badgeColor: 'bg-purple-950 text-purple-300 border-purple-800',
    },
    {
      id: 'discovery',
      label: 'Academic Discovery',
      icon: Compass,
      badge: 'arXiv',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    },
    {
      id: 'writing',
      label: 'Writing Studio',
      icon: PenTool,
      badge: '7 Modes',
      badgeColor: 'bg-indigo-950 text-indigo-300 border-indigo-800',
    },
    {
      id: 'automation',
      label: 'n8n Automation',
      icon: Workflow,
      badge: '12 Flows',
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    },
  ];

  return (
    <aside
      className={`relative flex flex-col border-r border-slate-800/80 bg-slate-950 transition-all duration-300 ease-in-out z-30 ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-40 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 hover:text-white shadow-md hover:bg-slate-800 transition-colors"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className={`px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${collapsed ? 'hidden' : 'block'}`}>
          Research Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all group relative cursor-pointer ${
                isActive
                  ? 'bg-indigo-600/15 text-indigo-200 border border-indigo-500/30 shadow-sm shadow-indigo-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              
              {!collapsed && (
                <div className="flex-1 flex items-center justify-between truncate text-left">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border leading-none ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {/* Active Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-indigo-500" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Pro Badge / Quick Info */}
      {!collapsed ? (
        <div className="p-3 m-3 rounded-xl border border-slate-800/80 bg-slate-900/60 text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-medium mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>ResearchLens Pro</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Connected to Gemini 3.8 &amp; n8n Orchestrator. Real arXiv and OpenAlex querying active.
          </p>
        </div>
      ) : (
        <div className="p-3 flex justify-center text-slate-500">
          <BookOpen className="w-4 h-4" />
        </div>
      )}
    </aside>
  );
};
