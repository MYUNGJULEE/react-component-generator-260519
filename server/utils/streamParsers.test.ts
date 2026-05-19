import { describe, test, expect } from 'bun:test';
import { parseAnthropicSSELine, parseGoogleNDJSONLine } from './streamParsers';

describe('parseAnthropicSSELine', () => {
  test('content_block_delta + text_delta 이벤트에서 텍스트를 반환한다', () => {
    const line = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"const "}}';
    expect(parseAnthropicSSELine(line)).toBe('const ');
  });

  test('빈 텍스트 delta를 그대로 반환한다', () => {
    const line = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":""}}';
    expect(parseAnthropicSSELine(line)).toBe('');
  });

  test('message_delta (stop) 이벤트는 null을 반환한다', () => {
    const line = 'data: {"type":"message_delta","delta":{"stop_reason":"end_turn"}}';
    expect(parseAnthropicSSELine(line)).toBeNull();
  });

  test('content_block_start 이벤트는 null을 반환한다', () => {
    const line = 'data: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}';
    expect(parseAnthropicSSELine(line)).toBeNull();
  });

  test('message_start 이벤트는 null을 반환한다', () => {
    const line = 'data: {"type":"message_start","message":{"id":"msg_01"}}';
    expect(parseAnthropicSSELine(line)).toBeNull();
  });

  test('event: 접두사 줄(data 아님)은 null을 반환한다', () => {
    const line = 'event: content_block_delta';
    expect(parseAnthropicSSELine(line)).toBeNull();
  });

  test('빈 줄은 null을 반환한다', () => {
    expect(parseAnthropicSSELine('')).toBeNull();
  });

  test('JSON 파싱 실패 줄은 null을 반환한다 (throw 없음)', () => {
    const line = 'data: {invalid json';
    expect(() => parseAnthropicSSELine(line)).not.toThrow();
    expect(parseAnthropicSSELine(line)).toBeNull();
  });

  test('text_delta가 아닌 delta type은 null을 반환한다', () => {
    const line = 'data: {"type":"content_block_delta","index":0,"delta":{"type":"input_json_delta","partial_json":""}}';
    expect(parseAnthropicSSELine(line)).toBeNull();
  });
});

describe('parseGoogleNDJSONLine', () => {
  test('유효한 candidates JSON에서 텍스트를 반환한다', () => {
    const line = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'const Button' }] } }],
    });
    expect(parseGoogleNDJSONLine(line)).toBe('const Button');
  });

  test('parts 배열에 text가 여러 개면 join한다', () => {
    const line = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'hello ' }, { text: 'world' }] } }],
    });
    expect(parseGoogleNDJSONLine(line)).toBe('hello world');
  });

  test('"[" 줄은 null을 반환한다', () => {
    expect(parseGoogleNDJSONLine('[')).toBeNull();
  });

  test('"]" 줄은 null을 반환한다', () => {
    expect(parseGoogleNDJSONLine(']')).toBeNull();
  });

  test('"," 줄은 null을 반환한다', () => {
    expect(parseGoogleNDJSONLine(',')).toBeNull();
  });

  test('빈 줄은 null을 반환한다', () => {
    expect(parseGoogleNDJSONLine('')).toBeNull();
  });

  test('candidates가 없는 JSON은 null을 반환한다', () => {
    const line = JSON.stringify({ error: { message: 'something' } });
    expect(parseGoogleNDJSONLine(line)).toBeNull();
  });

  test('candidates가 빈 배열이면 null을 반환한다', () => {
    const line = JSON.stringify({ candidates: [] });
    expect(parseGoogleNDJSONLine(line)).toBeNull();
  });

  test('parts가 없으면 null을 반환한다', () => {
    const line = JSON.stringify({ candidates: [{ content: {} }] });
    expect(parseGoogleNDJSONLine(line)).toBeNull();
  });

  test('JSON 파싱 실패는 null을 반환한다 (throw 없음)', () => {
    const line = '{invalid json';
    expect(() => parseGoogleNDJSONLine(line)).not.toThrow();
    expect(parseGoogleNDJSONLine(line)).toBeNull();
  });
});
