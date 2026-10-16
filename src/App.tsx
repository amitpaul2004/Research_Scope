import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { ContextExplorer } from './components/ContextExplorer';
import { PaperStudio } from './components/PaperStudio';
import { AiLikelihoodPanel } from './components/AiLikelihoodPanel';
import { PaperComparisonView } from './components/PaperComparisonView';
import { ResearchGapFinder } from './components/ResearchGapFinder';
import { AcademicDiscovery } from './components/AcademicDiscovery';
import { WritingImprover } from './components/WritingImprover';
import { N8nAutomationCenter } from './components/N8nAutomationCenter';
import { ExportModal } from './components/ExportModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { ScrollContainerProvider } from './components/animations/ScrollContainerContext';
import { api } from './api';
import {
  User,
  ResearchPaper,
  ResearchContextSession,
  ResearchGap,
  AutomationExecutionLog,
  NotificationItem,
} from './types';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  // Core Data State
  const [user, setUser] = useState<User | null>(null);
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [sessions, setSessions] = useState<ResearchContextSession[]>([]);
  const [gaps, setGaps] = useState<ResearchGap[]>([]);
  const [logs, setLogs] = useState<AutomationExecutionLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [analytics, setAnalytics] = useState<any>(null);

  // Active Selections
  const [activePaperForDetector, setActivePaperForDetector] = useState<ResearchPaper | null>(null);
  const [writingStudioInitialText, setWritingStudioInitialText] = useState('');
  const [exportTarget, setExportTarget] = useState<{ type: 'paper' | 'session'; id: string } | null>(null);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const mainScrollRef = useRef<HTMLElement>(null);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [uRes, pRes, sRes, gRes, lRes, nRes, aRes] = await Promise.all([
        api.getCurrentUser(),
        api.getPapers(),
        api.getContextSessions(),
        api.getGaps(),
        api.getAutomationLogs(),
        api.getNotifications(),
        api.getAnalytics(),
      ]);

      setUser(uRes.user);
      setPapers(pRes.papers);
      if (pRes.papers.length > 0 && !activePaperForDetector) {
        setActivePaperForDetector(pRes.papers[0]);
      }
      setSessions(sRes.sessions);
      setGaps(gRes.gaps);
      setLogs(lRes.logs);
      setNotifications(nRes.notifications);
      setUnreadCount(nRes.unreadCount);
      setAnalytics(aRes);
    } catch (err) {
      console.error('Error initializing application state:', err);
    }
  };

  const handleRefreshPapers = async () => {
    try {
      const res = await api.getPapers();
      setPapers(res.papers);
      if (activePaperForDetector) {
        const fresh = res.papers.find(p => p.id === activePaperForDetector.id);
        if (fresh) setActivePaperForDetector(fresh);
      } else if (res.papers.length > 0) {
        setActivePaperForDetector(res.papers[0]);
      }
    } catch (e) {
      console.error('Error refreshing papers:', e);
    }
  };

  const handleMarkNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(notifications.map(n => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenAiLikelihood = (paper: ResearchPaper) => {
    setActivePaperForDetector(paper);
    setCurrentView('detector');
  };

  const handleOpenWritingStudioWithText = (text?: string) => {
    if (text) setWritingStudioInitialText(text);
    setCurrentView('writing');
  };

  const handleExport = (type: 'paper' | 'session', id: string) => {
    setExportTarget({ type, id });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        paperCount={papers.length}
        gapCount={gaps.length}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <Navbar
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onOpenNotifications={() => setNotificationDrawerOpen(true)}
          onNavigate={setCurrentView}
          globalSearch={globalSearch}
          setGlobalSearch={setGlobalSearch}
        />

        {/* Scrollable View Content with 3D Scroll Context */}
        <ScrollContainerProvider containerRef={mainScrollRef}>
          <main
            ref={mainScrollRef}
            className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 perspective-1200"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                initial={{ opacity: 0, y: 14, rotateX: 3, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
                exit={{ opacity: 0, y: -14, rotateX: -3, scale: 0.99 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
                className="w-full"
              >
                {currentView === 'dashboard' && (
                  <DashboardView
                    analytics={analytics}
                    papers={papers}
                    sessions={sessions}
                    gaps={gaps}
                    logs={logs}
                    onNavigate={setCurrentView}
                    onSelectPaper={(p) => {
                      setActivePaperForDetector(p);
                      setCurrentView('papers');
                    }}
                  />
                )}

                {currentView === 'context' && (
                  <ContextExplorer
                    onExport={handleExport}
                    onNavigateToGaps={() => setCurrentView('gaps')}
                  />
                )}

                {currentView === 'papers' && (
                  <PaperStudio
                    papers={papers}
                    onRefreshPapers={handleRefreshPapers}
                    onOpenAiLikelihood={handleOpenAiLikelihood}
                    onOpenWritingImprover={handleOpenWritingStudioWithText}
                    onExport={handleExport}
                  />
                )}

                {currentView === 'detector' && (
                  <AiLikelihoodPanel
                    paper={activePaperForDetector || papers[0] || null}
                    onSendToWritingStudio={handleOpenWritingStudioWithText}
                    onRefreshPaper={handleRefreshPapers}
                    onOpenExportModal={(id) => handleExport('paper', id)}
                  />
                )}

                {currentView === 'compare' && (
                  <PaperComparisonView papers={papers} />
                )}

                {currentView === 'gaps' && (
                  <ResearchGapFinder />
                )}

                {currentView === 'discovery' && (
                  <AcademicDiscovery />
                )}

                {currentView === 'writing' && (
                  <WritingImprover initialText={writingStudioInitialText} />
                )}

                {currentView === 'automation' && (
                  <N8nAutomationCenter />
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </ScrollContainerProvider>
      </div>

      {/* Export Modal */}
      <ExportModal
        exportTarget={exportTarget}
        onClose={() => setExportTarget(null)}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationDrawerOpen}
        onClose={() => setNotificationDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotificationRead}
        onMarkAllRead={handleMarkAllNotificationsRead}
        onNavigate={setCurrentView}
      />
    </div>
  );
}
