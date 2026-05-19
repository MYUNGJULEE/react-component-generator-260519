import { useState, useCallback, useEffect } from 'react';
import type { GeneratedComponent, Provider, SSEEvent, StreamingComponent } from '../types';
import { loadComponents, saveComponents } from '../utils/storage';
import { createNewComponent, removeComponentById, clearAllComponents, generateComponentId } from './componentGeneratorLogic';

export async function* readSSEStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<SSEEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let leftover = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = leftover + decoder.decode(value, { stream: true });
      const lines = text.split('\n');
      leftover = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6)) as SSEEvent;
          yield event;
        } catch {
          // ignore parse errors
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  isLoading: boolean;
  error: string | null;
  streamingComponent: StreamingComponent | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useState<GeneratedComponent[]>(loadComponents);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingComponent, setStreamingComponent] = useState<StreamingComponent | null>(null);

  useEffect(() => {
    saveComponents(components);
  }, [components]);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const streamId = generateComponentId();
    setStreamingComponent({ id: streamId, prompt, streamingCode: '', isStreaming: true });

    try {
      const res = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error || 'Failed to generate component');
      }

      if (!res.body) {
        throw new Error('Response body is empty');
      }

      for await (const event of readSSEStream(res.body)) {
        if (event.type === 'token') {
          setStreamingComponent((prev) =>
            prev ? { ...prev, streamingCode: prev.streamingCode + event.delta } : prev
          );
        } else if (event.type === 'done') {
          const newComponent = createNewComponent(prompt, event.code);
          setComponents((prev) => [newComponent, ...prev]);
          setStreamingComponent(null);
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStreamingComponent(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => removeComponentById(prev, id));
  }, []);

  const clearAll = useCallback(() => {
    setComponents(clearAllComponents());
  }, []);

  return { components, isLoading, error, streamingComponent, generate, removeComponent, clearAll };
}
