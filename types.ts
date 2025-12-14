export type AppMode = 'compliance' | 'advice' | 'critical-thinking';

export type TaskType = 'research' | 'assignment' | 'study';

export type MarksStatus = 'yes' | 'no' | 'unsure';

export type ModuleRule = 'full' | 'limited' | 'none' | 'unknown';

export interface AIAdviceResponse {
  title: string;
  verdict: 'safe' | 'caution' | 'danger';
  advice: string;
  checklist: string[];
  suggestedPrompts: string[];
}