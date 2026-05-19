export type Provider = 'anthropic' | 'google';

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: Date;
}

export type SSEEvent =
  | { type: 'token'; delta: string }
  | { type: 'done'; code: string }
  | { type: 'error'; message: string };

export interface StreamingComponent {
  id: string;
  prompt: string;
  streamingCode: string;
  isStreaming: true;
}
