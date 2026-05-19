import type { GeneratedComponent } from '../types';

export const STORAGE_KEY = 'react-component-generator:components';

export function loadComponents(): GeneratedComponent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: unknown): GeneratedComponent => {
      const r = item as Record<string, unknown>;
      const dateStr = r['createdAt'];
      const parsedDate = typeof dateStr === 'string' ? new Date(dateStr) : null;
      const createdAt =
        parsedDate !== null && !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

      return {
        id: typeof r['id'] === 'string' ? r['id'] : '',
        prompt: typeof r['prompt'] === 'string' ? r['prompt'] : '',
        code: typeof r['code'] === 'string' ? r['code'] : '',
        createdAt,
      };
    });
  } catch {
    return [];
  }
}

export function saveComponents(components: GeneratedComponent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(components));
  } catch {
    // QuotaExceededError 등 저장 실패 시 조용히 무시
  }
}
