export interface User {
  id: string;
  name: string;
  email: string;
  role: 'researcher' | 'admin';
  institution?: string;
  createdAt: string;
}

export interface ResearchPaper {
  id: string;
  userId: string;
  title: string;
  authors: string[];
  publicationYear?: number;
  journalOrConference?: string;
  doi?: string;
  fileHash: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  pageCount: number;
  extractedText: string;
  uploadDate: string;
  status: 'uploaded' | 'processing' | 'analyzed' | 'error';
  tags: string[];
  categories: string[];
  collections: string[];
  
  // Analysis results
  analysis?: PaperAnalysis;
  // AI Likelihood results
  aiLikelihood?: AiLikelihoodReport;
}

export interface PaperPassage {
  id: string;
  pageNumber: number;
  text: string;
  aiScore: number; // 0-100
  humanScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  flaggedReasons: string[];
  coordinates?: { top: number; left: number; width: number; height: number };
}

export interface AiLikelihoodReport {
  overallAiScore: number; // 0 - 100
  overallHumanScore: number; // 0 - 100
  confidence: 'High' | 'Medium' | 'Low';
  methodologyExplanation: string;
  isExperimentalHeuristic: boolean;
  passages: PaperPassage[];
  pageStats: { page: number; averageAiScore: number; passageCount: number }[];
  analyzedAt: string;
}

export interface PaperAnalysis {
  abstract: string;
  executiveSummary: string;
  researchObjectives: string[];
  problemStatement: string;
  mainContributions: string[];
  methodology: string;
  algorithmsAndModels: string[];
  datasetInformation: string;
  experimentalSetup: string;
  resultsAndFindings: string[];
  limitations: string[];
  futureWork: string[];
  keyTerminology: { term: string; definition: string }[];
  references: { citation: string; year?: number; title?: string }[];
  suggestedTags: string[];
  analyzedAt: string;
}

export interface PaperChatMessage {
  id: string;
  paperId: string;
  role: 'user' | 'assistant';
  content: string;
  citations: {
    pageNumber: number;
    passageExcerpt: string;
  }[];
  timestamp: string;
}

export interface ResearchContextSession {
  id: string;
  userId: string;
  topicOrQuestion: string;
  additionalContext?: string;
  researchObjective?: string;
  academicDomain?: string;
  depth: 'Quick Overview' | 'Standard Analysis' | 'In-Depth Analysis';
  responseStyle: 'Academic & Formal' | 'Executive & Concise' | 'Comprehensive & Methodological';
  createdAt: string;
  updatedAt: string;
  status: 'processing' | 'completed' | 'failed';
  report?: ContextResearchReport;
  chatHistory: {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }[];
}

export interface ContextResearchReport {
  topicOverview: string;
  keyConcepts: { concept: string; explanation: string }[];
  researchBackground: string;
  existingApproaches: { approach: string; pros: string; cons: string }[];
  methodologyAnalysis: string;
  currentChallenges: string[];
  potentialResearchGaps: {
    title: string;
    description: string;
    gapType: 'methodological' | 'dataset' | 'theoretical' | 'application';
    urgency: 'High' | 'Medium' | 'Low';
  }[];
  researchQuestions: string[];
  potentialContributions: string[];
  recommendedMethodologies: string[];
  relatedResearchPapers: {
    title: string;
    authors: string[];
    year: number;
    source: string;
    url?: string;
    abstractExcerpt: string;
    relevanceReason: string;
    doi?: string;
  }[];
  furtherReading: { title: string; type: string; linkOrReference: string }[];
  verifiedVsHypotheses: {
    verifiedFacts: string[];
    aiInterpretations: string[];
    untestedHypotheses: string[];
  };
  generatedAt: string;
}

export interface ResearchGap {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: 'Methodological' | 'Dataset & Benchmark' | 'Theoretical' | 'Evaluation & Generalization' | 'Real-World Constraints';
  supportingPapers: { paperId?: string; paperTitle: string; pageReferences?: string; quoteOrFinding?: string }[];
  limitationsInExistingWork: string[];
  whyItMatters: string;
  potentialResearchQuestions: string[];
  possibleMethodologies: string[];
  suggestedExperiments: string[];
  expectedChallenges: string[];
  evidenceStrength: 'Strong Literature Evidence' | 'Emerging Pattern' | 'AI-Generated Hypothesis';
  isBookmarked: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaperComparison {
  id: string;
  userId: string;
  title: string;
  paperIds: string[];
  createdAt: string;
  summary: string;
  comparisonMatrix: {
    criterion: string;
    papers: { [paperId: string]: string };
  }[];
  methodologyTradeoffs: {
    approachA: string;
    approachB: string;
    tradeoffs: string;
  }[];
  combinedResearchGaps: string[];
  conclusion: string;
}

export interface N8nAutomationWorkflow {
  id: string;
  key: string;
  name: string;
  description: string;
  triggerType: 'webhook' | 'schedule' | 'event';
  schedule?: string;
  webhookPath: string;
  isActive: boolean;
  lastRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'running';
  totalRuns: number;
  successRate: number;
  n8nWorkflowJson: Record<string, unknown>;
}

export interface AutomationExecutionLog {
  id: string;
  workflowKey: string;
  workflowName: string;
  jobId: string;
  triggeredBy: string;
  startedAt: string;
  completedAt?: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  retryCount: number;
  inputPayload: Record<string, unknown>;
  outputResult?: Record<string, unknown>;
  errorMessage?: string;
  executionMode: 'n8n_remote' | 'local_fallback' | 'fallback_recovery';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'paper' | 'gap' | 'digest' | 'automation' | 'discovery';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface ResearchDiscoverySubscription {
  id: string;
  userId: string;
  topic: string;
  keywords: string[];
  domains: string[];
  sources: ('arxiv' | 'openalex' | 'crossref')[];
  frequency: 'daily' | 'weekly';
  lastRunAt?: string;
  isActive: boolean;
}

export interface WritingRevision {
  id: string;
  originalText: string;
  revisedText: string;
  mode: string;
  explanation: string;
  createdAt: string;
  accepted: boolean;
}
