import fs from 'fs';
import path from 'path';
import {
  User,
  ResearchPaper,
  ResearchContextSession,
  ResearchGap,
  PaperComparison,
  AutomationExecutionLog,
  NotificationItem,
  ResearchDiscoverySubscription,
  WritingRevision,
} from './types';

interface DatabaseSchema {
  users: User[];
  papers: ResearchPaper[];
  contextSessions: ResearchContextSession[];
  gaps: ResearchGap[];
  comparisons: PaperComparison[];
  executionLogs: AutomationExecutionLog[];
  notifications: NotificationItem[];
  subscriptions: ResearchDiscoverySubscription[];
  revisions: WritingRevision[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_USER: User = {
  id: 'usr_default',
  name: 'Researcher',
  email: 'pal900290@gmail.com',
  role: 'researcher',
  institution: 'Research Institute',
  createdAt: new Date().toISOString(),
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadFromDisk();
  }

  private loadFromDisk(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          users: parsed.users || [INITIAL_USER],
          papers: parsed.papers || [],
          contextSessions: parsed.contextSessions || [],
          gaps: parsed.gaps || [],
          comparisons: parsed.comparisons || [],
          executionLogs: parsed.executionLogs || [],
          notifications: parsed.notifications || [],
          subscriptions: parsed.subscriptions || [],
          revisions: parsed.revisions || [],
        };
      }
    } catch (e) {
      console.warn('Could not load database file, initializing clean empty database:', e);
    }

    const initial: DatabaseSchema = {
      users: [INITIAL_USER],
      papers: [],
      contextSessions: [],
      gaps: [],
      comparisons: [],
      executionLogs: [],
      notifications: [],
      subscriptions: [],
      revisions: [],
    };
    this.saveToDisk(initial);
    return initial;
  }

  public saveToDisk(dataToSave: DatabaseSchema = this.data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public clearAllData(): void {
    this.data = {
      users: [INITIAL_USER],
      papers: [],
      contextSessions: [],
      gaps: [],
      comparisons: [],
      executionLogs: [],
      notifications: [],
      subscriptions: [],
      revisions: [],
    };
    this.saveToDisk();
  }

  // Users
  getUser(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }
  getCurrentUser(): User {
    return this.data.users[0] || INITIAL_USER;
  }

  // Papers
  getPapers(userId?: string): ResearchPaper[] {
    if (!userId) return this.data.papers;
    return this.data.papers.filter(p => p.userId === userId);
  }

  getPaperById(id: string): ResearchPaper | undefined {
    return this.data.papers.find(p => p.id === id);
  }

  getPaperByHash(hash: string): ResearchPaper | undefined {
    return this.data.papers.find(p => p.fileHash === hash);
  }

  addPaper(paper: ResearchPaper): ResearchPaper {
    this.data.papers.unshift(paper);
    this.saveToDisk();
    return paper;
  }

  updatePaper(id: string, updates: Partial<ResearchPaper>): ResearchPaper | undefined {
    const idx = this.data.papers.findIndex(p => p.id === id);
    if (idx === -1) return undefined;
    this.data.papers[idx] = { ...this.data.papers[idx], ...updates };
    this.saveToDisk();
    return this.data.papers[idx];
  }

  deletePaper(id: string): boolean {
    const initialLen = this.data.papers.length;
    this.data.papers = this.data.papers.filter(p => p.id !== id);
    if (this.data.papers.length !== initialLen) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Context Sessions
  getContextSessions(userId?: string): ResearchContextSession[] {
    if (!userId) return this.data.contextSessions;
    return this.data.contextSessions.filter(s => s.userId === userId);
  }

  getContextSessionById(id: string): ResearchContextSession | undefined {
    return this.data.contextSessions.find(s => s.id === id);
  }

  addContextSession(session: ResearchContextSession): ResearchContextSession {
    this.data.contextSessions.unshift(session);
    this.saveToDisk();
    return session;
  }

  updateContextSession(id: string, updates: Partial<ResearchContextSession>): ResearchContextSession | undefined {
    const idx = this.data.contextSessions.findIndex(s => s.id === id);
    if (idx === -1) return undefined;
    this.data.contextSessions[idx] = {
      ...this.data.contextSessions[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.saveToDisk();
    return this.data.contextSessions[idx];
  }

  deleteContextSession(id: string): boolean {
    const len = this.data.contextSessions.length;
    this.data.contextSessions = this.data.contextSessions.filter(s => s.id !== id);
    if (this.data.contextSessions.length !== len) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Research Gaps
  getGaps(userId?: string): ResearchGap[] {
    if (!userId) return this.data.gaps;
    return this.data.gaps.filter(g => g.userId === userId);
  }

  getGapById(id: string): ResearchGap | undefined {
    return this.data.gaps.find(g => g.id === id);
  }

  addGap(gap: ResearchGap): ResearchGap {
    this.data.gaps.unshift(gap);
    this.saveToDisk();
    return gap;
  }

  updateGap(id: string, updates: Partial<ResearchGap>): ResearchGap | undefined {
    const idx = this.data.gaps.findIndex(g => g.id === id);
    if (idx === -1) return undefined;
    this.data.gaps[idx] = { ...this.data.gaps[idx], ...updates, updatedAt: new Date().toISOString() };
    this.saveToDisk();
    return this.data.gaps[idx];
  }

  deleteGap(id: string): boolean {
    const len = this.data.gaps.length;
    this.data.gaps = this.data.gaps.filter(g => g.id !== id);
    if (this.data.gaps.length !== len) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Comparisons
  getComparisons(userId?: string): PaperComparison[] {
    if (!userId) return this.data.comparisons;
    return this.data.comparisons.filter(c => c.userId === userId);
  }

  getComparisonById(id: string): PaperComparison | undefined {
    return this.data.comparisons.find(c => c.id === id);
  }

  addComparison(comp: PaperComparison): PaperComparison {
    this.data.comparisons.unshift(comp);
    this.saveToDisk();
    return comp;
  }

  // Execution Logs
  getExecutionLogs(): AutomationExecutionLog[] {
    return this.data.executionLogs;
  }

  addExecutionLog(log: AutomationExecutionLog): AutomationExecutionLog {
    this.data.executionLogs.unshift(log);
    if (this.data.executionLogs.length > 100) {
      this.data.executionLogs = this.data.executionLogs.slice(0, 100);
    }
    this.saveToDisk();
    return log;
  }

  updateExecutionLog(id: string, updates: Partial<AutomationExecutionLog>) {
    const idx = this.data.executionLogs.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.executionLogs[idx] = { ...this.data.executionLogs[idx], ...updates };
      this.saveToDisk();
    }
  }

  // Notifications
  getNotifications(userId?: string): NotificationItem[] {
    if (!userId) return this.data.notifications;
    return this.data.notifications.filter(n => n.userId === userId);
  }

  addNotification(notif: NotificationItem): NotificationItem {
    this.data.notifications.unshift(notif);
    this.saveToDisk();
    return notif;
  }

  markNotificationRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveToDisk();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId?: string): void {
    for (const notif of this.data.notifications) {
      if (!userId || notif.userId === userId) {
        notif.read = true;
      }
    }
    this.saveToDisk();
  }

  // Subscriptions
  getSubscriptions(userId?: string): ResearchDiscoverySubscription[] {
    if (!userId) return this.data.subscriptions;
    return this.data.subscriptions.filter(s => s.userId === userId);
  }

  addSubscription(sub: ResearchDiscoverySubscription): ResearchDiscoverySubscription {
    this.data.subscriptions.unshift(sub);
    this.saveToDisk();
    return sub;
  }

  deleteSubscription(id: string): boolean {
    const len = this.data.subscriptions.length;
    this.data.subscriptions = this.data.subscriptions.filter(s => s.id !== id);
    if (this.data.subscriptions.length !== len) {
      this.saveToDisk();
      return true;
    }
    return false;
  }

  // Writing Revisions
  getRevisions(): WritingRevision[] {
    return this.data.revisions;
  }

  addRevision(rev: WritingRevision): WritingRevision {
    this.data.revisions.unshift(rev);
    this.saveToDisk();
    return rev;
  }
}

export const db = new Database();
