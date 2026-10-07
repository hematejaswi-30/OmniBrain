// lib/ingest-router.ts

export type SourceType = 'instagram' | 'whatsapp' | 'gdrive' | 'web' | 'text';

export type RouteType = 'url' | 'task' | 'question' | 'snippet' | 'unknown';

export interface RouteResult {
  type: RouteType;
  payload: string;
  metadata?: any;
}

/**
 * Route raw input payload to determine source_type ('instagram', 'whatsapp', 'gdrive', 'web', 'text')
 */
export const routePayload = (input: string): SourceType => {
  const trimmed = input.trim().toLowerCase();
  if (trimmed.includes('instagram.com') || trimmed.includes('reel')) {
    return 'instagram';
  }
  if (trimmed.includes('whatsapp') || trimmed.includes('wa.me') || trimmed.startsWith('whatsapp')) {
    return 'whatsapp';
  }
  if (trimmed.includes('drive.google.com') || trimmed.includes('docs.google.com') || trimmed.includes('gdrive')) {
    return 'gdrive';
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return 'web';
  }
  return 'text';
};

/**
 * Universal Omnibox Regex Router
 * Analyzes raw input from the Omnibox and routes it to the appropriate handler based on regex patterns.
 */
export const ingestRouter = (input: string): RouteResult => {
  const urlRegex = /^(https?:\/\/[^\s]+)/;
  const taskRegex = /^(TODO|TASK|TODO:|TASK:)\s+(.*)/i;
  const questionRegex = /^(.*\?)$/;

  if (urlRegex.test(input)) {
    return { type: 'url', payload: input.trim() };
  }

  const taskMatch = input.match(taskRegex);
  if (taskMatch) {
    return { type: 'task', payload: taskMatch[2].trim() };
  }

  if (questionRegex.test(input)) {
    return { type: 'question', payload: input.trim() };
  }

  // Fallback for code snippet or other text
  if (input.includes('const') || input.includes('function') || input.includes('=>')) {
    return { type: 'snippet', payload: input.trim() };
  }

  return { type: 'unknown', payload: input.trim() };
};

// Enforce 4.5 second spacing rule between Gemini Flash calls to stay within free tier quotas
let lastGeminiCallTime = 0;

export const callGeminiFlashWithSpacing = async <T>(prompt: string, callGeminiFn: (p: string) => Promise<T>): Promise<T> => {
  const now = Date.now();
  const timeSinceLastCall = now - lastGeminiCallTime;
  const spacingMs = 4500; // 4.5 seconds

  if (timeSinceLastCall < spacingMs) {
    const delay = spacingMs - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  lastGeminiCallTime = Date.now();
  return await callGeminiFn(prompt);
};
