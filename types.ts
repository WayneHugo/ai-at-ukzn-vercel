export type AppMode = 'compliance' | 'advice' | 'critical-thinking' | 'log';

export type TaskType = 'research' | 'assignment' | 'study';

export type MarksStatus = 'yes' | 'no' | 'unsure';

export type ModuleRule = 'full' | 'limited' | 'none' | 'unknown';

export interface LogEntry {
  id: string;
  prompt: string;
  output: string;
  refinement: string;
}

export interface AIAdviceResponse {
  title: string;
  verdict: 'safe' | 'caution' | 'danger';
  advice: string;
  checklist: string[];
  suggestedPrompts: string[];
}