export function parseAnthropicSSELine(line: string): string | null {
  if (!line.startsWith('data: ')) return null;
  try {
    const data = JSON.parse(line.slice(6)) as {
      type?: string;
      delta?: { type?: string; text?: string };
    };
    if (
      data.type === 'content_block_delta' &&
      data.delta?.type === 'text_delta' &&
      data.delta.text !== undefined
    ) {
      return data.delta.text;
    }
  } catch {
    // ignore parse errors
  }
  return null;
}

export function parseGoogleNDJSONLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed === '[' || trimmed === ']' || trimmed === ',') return null;
  try {
    const data = JSON.parse(trimmed) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const parts = data.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) return null;
    const text = parts.map((p) => p.text ?? '').join('');
    return text || null;
  } catch {
    return null;
  }
}
