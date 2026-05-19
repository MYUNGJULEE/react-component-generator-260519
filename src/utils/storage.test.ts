import { describe, test, expect, beforeEach } from 'bun:test';
import type { GeneratedComponent } from '../types';

// localStorage mock
const mockStore: Record<string, string> = {};
global.localStorage = {
  getItem: (key: string) => mockStore[key] ?? null,
  setItem: (key: string, value: string) => {
    mockStore[key] = value;
  },
  removeItem: (key: string) => {
    delete mockStore[key];
  },
  clear: () => {
    Object.keys(mockStore).forEach((key) => delete mockStore[key]);
  },
  length: 0,
  key: () => null,
} as any;

import { loadComponents, saveComponents, STORAGE_KEY } from './storage';

beforeEach(() => {
  localStorage.clear();
});

describe('STORAGE_KEY', () => {
  test('상수가 문자열로 export된다', () => {
    expect(typeof STORAGE_KEY).toBe('string');
  });
});

describe('loadComponents', () => {
  test('localStorage가 비어있으면 빈 배열을 반환한다', () => {
    const result = loadComponents();
    expect(result).toEqual([]);
  });

  test('저장된 컴포넌트를 반환하며 createdAt이 Date 객체다', () => {
    const raw = JSON.stringify([
      {
        id: 'abc123',
        prompt: '버튼 컴포넌트',
        code: 'render(<button>click</button>)',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ]);
    localStorage.setItem(STORAGE_KEY, raw);

    const result = loadComponents();
    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].id).toBe('abc123');
  });

  test('복수 컴포넌트를 올바르게 로드한다', () => {
    const items = [
      { id: 'a', prompt: 'p1', code: 'c1', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', prompt: 'p2', code: 'c2', createdAt: '2026-02-01T00:00:00.000Z' },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    const result = loadComponents();
    expect(result).toHaveLength(2);
    result.forEach((c) => expect(c.createdAt).toBeInstanceOf(Date));
  });

  test('손상된 JSON이 있으면 빈 배열을 반환하고 throw하지 않는다', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json');
    expect(() => loadComponents()).not.toThrow();
    expect(loadComponents()).toEqual([]);
  });

  test('createdAt 문자열 파싱 실패 시 현재 시각으로 폴백한다', () => {
    const raw = JSON.stringify([
      { id: 'x', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
    ]);
    localStorage.setItem(STORAGE_KEY, raw);
    const result = loadComponents();
    expect(result[0].createdAt).toBeInstanceOf(Date);
  });
});

describe('saveComponents', () => {
  test('컴포넌트 배열을 localStorage에 저장한다', () => {
    const components: GeneratedComponent[] = [
      {
        id: 'z1',
        prompt: '카드',
        code: 'render(<div/>)',
        createdAt: new Date('2026-03-01T12:00:00.000Z'),
      },
    ];
    saveComponents(components);

    const stored = localStorage.getItem(STORAGE_KEY);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('z1');
    expect(typeof parsed[0].createdAt).toBe('string');
  });

  test('빈 배열 저장 시 빈 배열 JSON이 기록된다', () => {
    saveComponents([]);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]');
  });

  test('saveComponents 후 loadComponents하면 동일한 데이터가 복원된다', () => {
    const components: GeneratedComponent[] = [
      {
        id: 'roundtrip',
        prompt: '왕복 테스트',
        code: 'render(<span/>)',
        createdAt: new Date('2026-04-15T09:30:00.000Z'),
      },
    ];
    saveComponents(components);
    const loaded = loadComponents();

    expect(loaded[0].id).toBe('roundtrip');
    expect(loaded[0].createdAt).toBeInstanceOf(Date);
    expect(loaded[0].createdAt.toISOString()).toBe('2026-04-15T09:30:00.000Z');
  });
});
