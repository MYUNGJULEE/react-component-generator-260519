import type { GeneratedComponent, SSEEvent } from '../types';

/**
 * Pure functions for component generation logic
 * These functions can be tested independently without React
 */

/**
 * Generates a unique ID for a new component
 */
export function generateComponentId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Creates a new GeneratedComponent from API response
 */
export function createNewComponent(
  prompt: string,
  code: string,
  id: string = generateComponentId()
): GeneratedComponent {
  return {
    id,
    prompt,
    code,
    createdAt: new Date(),
  };
}

/**
 * Adds a new component to the beginning of the components array
 */
export function addComponent(
  components: GeneratedComponent[],
  newComponent: GeneratedComponent
): GeneratedComponent[] {
  return [newComponent, ...components];
}

/**
 * Removes a component by ID from the components array
 */
export function removeComponentById(
  components: GeneratedComponent[],
  id: string
): GeneratedComponent[] {
  return components.filter((c) => c.id !== id);
}

/**
 * Clears all components (returns empty array)
 */
export function clearAllComponents(): GeneratedComponent[] {
  return [];
}

export function processSSELines(lines: string[]): {
  deltas: string[];
  finalCode: string | null;
  error: string | null;
} {
  const deltas: string[] = [];
  let finalCode: string | null = null;
  let error: string | null = null;

  for (const line of lines) {
    if (!line.startsWith('data: ')) continue;
    try {
      const event = JSON.parse(line.slice(6)) as SSEEvent;
      if (event.type === 'token') {
        deltas.push(event.delta);
      } else if (event.type === 'done') {
        finalCode = event.code;
      } else if (event.type === 'error') {
        error = event.message;
      }
    } catch {
      // ignore parse errors
    }
  }

  return { deltas, finalCode, error };
}
