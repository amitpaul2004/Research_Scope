import {
  User,
  ResearchPaper,
  ResearchContextSession,
  ResearchGap,
  PaperComparison,
  N8nAutomationWorkflow,
  AutomationExecutionLog,
  NotificationItem,
  ResearchDiscoverySubscription,
  WritingRevision,
  NormalizedAcademicPaper,
} from './types';

const BASE_URL = '/api/v1';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // User & Analytics
  getCurrentUser: () => fetchJson<{ user: User }>(`${BASE_URL}/user/me`),
  getAnalytics: () => fetchJson<{
    metrics: {
      totalPapers: number;
      analyzedPapers: number;
      totalSessions: number;
      totalGaps: number;
      bookmarkedGaps: number;
      totalComparisons: number;
      totalAutomations: number;
      successfulAutomations: number;
      failedAutomations: number;
      automationHealthRate: number;
    };
    categoryDistribution: { name: string; count: number }[];
    gapCategoryDistribution: { name: string; count: number }[];
    yearDistribution: { year: string; count: number }[];
  }>(`${BASE_URL}/analytics`),

  // Notifications
  getNotifications: () => fetchJson<{ notifications: NotificationItem[]; unreadCount: number }>(`${BASE_URL}/notifications`),
  markNotificationRead: (id: string) => fetchJson<{ success: boolean }>(`${BASE_URL}/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => fetchJson<{ success: boolean }>(`${BASE_URL}/notifications/read-all`, { method: 'POST' }),

  // Context Explorer
  analyzeContext: (params: {
    topicOrQuestion: string;
    additionalContext?: string;
    researchObjective?: string;
    academicDomain?: string;
    depth?: string;
    responseStyle?: string;
  }) => fetchJson<{ session: ResearchContextSession }>(`${BASE_URL}/research/context/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }),
  getContextSessions: () => fetchJson<{ sessions: ResearchContextSession[] }>(`${BASE_URL}/research/context/sessions`),
  getContextSession: (id: string) => fetchJson<{ session: ResearchContextSession }>(`${BASE_URL}/research/context/sessions/${id}`),
  sendContextChat: (sessionId: string, question: string) => fetchJson<{
    message: { id: string; role: 'assistant'; content: string; timestamp: string };
    chatHistory: { id: string; role: 'user' | 'assistant'; content: string; timestamp: string }[];
  }>(`${BASE_URL}/research/context/sessions/${sessionId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  }),
  deleteContextSession: (id: string) => fetchJson<{ success: boolean }>(`${BASE_URL}/research/context/sessions/${id}`, { method: 'DELETE' }),

  // Papers & Upload
  uploadPapers: (formData: FormData) => fetchJson<{ papers: ResearchPaper[] }>(`${BASE_URL}/papers/upload`, {
    method: 'POST',
    body: formData,
  }),
  getPapers: (query?: string, collection?: string, tag?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (collection) params.append('collection', collection);
    if (tag) params.append('tag', tag);
    return fetchJson<{ papers: ResearchPaper[] }>(`${BASE_URL}/papers?${params.toString()}`);
  },
  getPaper: (id: string) => fetchJson<{ paper: ResearchPaper }>(`${BASE_URL}/papers/${id}`),
  deletePaper: (id: string) => fetchJson<{ success: boolean }>(`${BASE_URL}/papers/${id}`, { method: 'DELETE' }),
  askPaper: (id: string, question: string) => fetchJson<{
    answer: string;
    citations: { pageNumber: number; passageExcerpt: string }[];
  }>(`${BASE_URL}/papers/${id}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  }),
  reanalyzeAiLikelihood: (id: string) => fetchJson<{ aiLikelihood: any; paper: ResearchPaper }>(`${BASE_URL}/papers/${id}/ai-likelihood`, {
    method: 'POST',
  }),

  // Multi-Paper Comparison
  runComparison: (paperIds: string[]) => fetchJson<{ comparison: PaperComparison }>(`${BASE_URL}/research/compare/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paperIds }),
  }),
  getComparisons: () => fetchJson<{ comparisons: PaperComparison[] }>(`${BASE_URL}/research/compare`),
  getComparison: (id: string) => fetchJson<{ comparison: PaperComparison }>(`${BASE_URL}/research/compare/${id}`),

  // Research Gaps
  getGaps: (category?: string, bookmarkedOnly?: boolean) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (bookmarkedOnly) params.append('bookmarkedOnly', 'true');
    return fetchJson<{ gaps: ResearchGap[] }>(`${BASE_URL}/research/gaps?${params.toString()}`);
  },
  discoverGaps: (topic?: string, contextSnippet?: string) => fetchJson<{ gaps: ResearchGap[] }>(`${BASE_URL}/research/gaps/discover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, contextSnippet }),
  }),
  toggleBookmarkGap: (id: string, isBookmarked: boolean) => fetchJson<{ gap: ResearchGap }>(`${BASE_URL}/research/gaps/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isBookmarked }),
  }),
  deleteGap: (id: string) => fetchJson<{ success: boolean }>(`${BASE_URL}/research/gaps/${id}`, { method: 'DELETE' }),

  // Academic Discovery
  searchAcademic: (query: string, source: 'all' | 'arxiv' | 'openalex' = 'all') => {
    return fetchJson<{ papers: NormalizedAcademicPaper[]; source: string }>(
      `${BASE_URL}/research/academic/search?q=${encodeURIComponent(query)}&source=${source}`
    );
  },
  getSubscriptions: () => fetchJson<{ subscriptions: ResearchDiscoverySubscription[] }>(`${BASE_URL}/research/academic/subscriptions`),
  createSubscription: (data: { topic: string; keywords?: string[]; domains?: string[]; frequency?: 'daily' | 'weekly' }) =>
    fetchJson<{ subscription: ResearchDiscoverySubscription }>(`${BASE_URL}/research/academic/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
  deleteSubscription: (id: string) => fetchJson<{ success: boolean }>(`${BASE_URL}/research/academic/subscriptions/${id}`, { method: 'DELETE' }),

  // Automation / n8n
  getWorkflows: () => fetchJson<{
    workflows: N8nAutomationWorkflow[];
    config: { enabled: boolean; webhookBaseUrl: string; hasSecret: boolean };
  }>(`${BASE_URL}/automation/workflows`),
  getAutomationLogs: () => fetchJson<{ logs: AutomationExecutionLog[] }>(`${BASE_URL}/automation/logs`),
  triggerWorkflow: (workflowKey: string, payload?: any) => fetchJson<{ executionLog: AutomationExecutionLog; result: any }>(
    `${BASE_URL}/automation/trigger/${workflowKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    }
  ),
  retryExecutionLog: (logId: string, forceLocal?: boolean) => fetchJson<{ executionLog: AutomationExecutionLog; result: any }>(
    `${BASE_URL}/automation/logs/${logId}/retry`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ forceLocal }),
    }
  ),
  deleteAutomationLog: (logId: string) => fetchJson<{ success: boolean }>(
    `${BASE_URL}/automation/logs/${logId}`,
    { method: 'DELETE' }
  ),
  clearFailedAutomationLogs: () => fetchJson<{ success: boolean; clearedCount: number }>(
    `${BASE_URL}/automation/logs/clear-failed`,
    { method: 'POST' }
  ),
  testN8nConnection: (webhookBaseUrl?: string) => fetchJson<{ success: boolean; status: number; message: string; hint?: string }>(
    `${BASE_URL}/automation/test-connection`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookBaseUrl }),
    }
  ),
  updateN8nConfig: (config: { webhookBaseUrl: string; webhookSecret: string; enabled: boolean }) =>
    fetchJson<{ config: any }>(`${BASE_URL}/automation/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }),

  // Writing Improver
  improveWriting: (params: { text: string; mode: string; customInstructions?: string }) =>
    fetchJson<{ revision: WritingRevision; improvements: string[] }>(`${BASE_URL}/writing/improve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    }),
  getRevisions: () => fetchJson<{ revisions: WritingRevision[] }>(`${BASE_URL}/writing/revisions`),

  // Exports
  generateExport: (type: 'paper' | 'session', id: string, format: 'markdown' | 'bibtex' = 'markdown') =>
    fetchJson<{ format: string; content: string; filename: string }>(`${BASE_URL}/exports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, format }),
    }),
};
