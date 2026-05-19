import { parseAnthropicSSELine, parseGoogleNDJSONLine } from './streamParsers.js';

export async function* streamAnthropic(
  prompt: string,
  apiKey: string,
  systemPrompt: string
): AsyncGenerator<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  const reader = response.body.getReader();
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
        const delta = parseAnthropicSSELine(line);
        if (delta !== null) yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function* streamGoogle(
  prompt: string,
  apiKey: string,
  systemPrompt: string
): AsyncGenerator<string> {
  const model = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${apiKey}&alt=sse`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  const reader = response.body.getReader();
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
        // Google SSE format: "data: {json}"
        const jsonLine = line.startsWith('data: ') ? line.slice(6) : line;
        const delta = parseGoogleNDJSONLine(jsonLine);
        if (delta !== null) yield delta;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
