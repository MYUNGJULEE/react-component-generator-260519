import { describe, test, expect } from 'bun:test';
import type { GeneratedComponent } from '../types';
import {
  generateComponentId,
  createNewComponent,
  addComponent,
  removeComponentById,
  clearAllComponents,
  processSSELines,
} from './componentGeneratorLogic';

describe('Component Generator Logic - Pure Functions', () => {
  describe('generateComponentId', () => {
    test('생성된 ID는 문자열이다', () => {
      const id = generateComponentId();
      expect(typeof id).toBe('string');
    });

    test('생성된 ID는 고유하다', () => {
      const id1 = generateComponentId();
      // Small delay to ensure different timestamps
      const id2 = generateComponentId();
      expect(id1).not.toBe(id2);
    });

    test('생성된 ID는 비어있지 않다', () => {
      const id = generateComponentId();
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('createNewComponent', () => {
    test('유효한 GeneratedComponent 객체를 반환한다', () => {
      const component = createNewComponent('버튼', 'render(<button/>)');
      expect(component.id).toBeDefined();
      expect(component.prompt).toBe('버튼');
      expect(component.code).toBe('render(<button/>)');
      expect(component.createdAt).toBeInstanceOf(Date);
    });

    test('커스텀 ID를 사용할 수 있다', () => {
      const customId = 'custom-123';
      const component = createNewComponent('버튼', 'render(<button/>)', customId);
      expect(component.id).toBe(customId);
    });

    test('createdAt은 현재 시각이다', () => {
      const beforeCreation = new Date();
      const component = createNewComponent('버튼', 'render(<button/>)');
      const afterCreation = new Date();

      expect(component.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
      expect(component.createdAt.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    });
  });

  describe('addComponent', () => {
    test('새 컴포넌트를 배열의 맨 앞에 추가한다', () => {
      const existing: GeneratedComponent[] = [
        { id: 'a', prompt: 'p1', code: 'c1', createdAt: new Date() },
        { id: 'b', prompt: 'p2', code: 'c2', createdAt: new Date() },
      ];
      const newComp = { id: 'c', prompt: 'p3', code: 'c3', createdAt: new Date() };

      const result = addComponent(existing, newComp);

      expect(result.length).toBe(3);
      expect(result[0]).toEqual(newComp);
      expect(result[1]).toEqual(existing[0]);
      expect(result[2]).toEqual(existing[1]);
    });

    test('빈 배열에 추가하면 길이가 1이 된다', () => {
      const result = addComponent([], {
        id: 'x',
        prompt: 'px',
        code: 'cx',
        createdAt: new Date(),
      });

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('x');
    });

    test('원본 배열을 수정하지 않는다 (immutable)', () => {
      const original: GeneratedComponent[] = [
        { id: 'a', prompt: 'p1', code: 'c1', createdAt: new Date() },
      ];
      const originalLength = original.length;
      const newComp = { id: 'b', prompt: 'p2', code: 'c2', createdAt: new Date() };

      addComponent(original, newComp);

      expect(original.length).toBe(originalLength);
    });
  });

  describe('removeComponentById', () => {
    test('지정된 ID의 컴포넌트를 제거한다', () => {
      const components: GeneratedComponent[] = [
        { id: 'a', prompt: 'p1', code: 'c1', createdAt: new Date() },
        { id: 'b', prompt: 'p2', code: 'c2', createdAt: new Date() },
        { id: 'c', prompt: 'p3', code: 'c3', createdAt: new Date() },
      ];

      const result = removeComponentById(components, 'b');

      expect(result.length).toBe(2);
      expect(result.some((c) => c.id === 'b')).toBe(false);
      expect(result.some((c) => c.id === 'a')).toBe(true);
      expect(result.some((c) => c.id === 'c')).toBe(true);
    });

    test('없는 ID를 제거하려고 해도 배열이 변하지 않는다', () => {
      const components: GeneratedComponent[] = [
        { id: 'a', prompt: 'p1', code: 'c1', createdAt: new Date() },
      ];

      const result = removeComponentById(components, 'nonexistent');

      expect(result.length).toBe(1);
      expect(result[0].id).toBe('a');
    });

    test('원본 배열을 수정하지 않는다 (immutable)', () => {
      const original: GeneratedComponent[] = [
        { id: 'a', prompt: 'p1', code: 'c1', createdAt: new Date() },
        { id: 'b', prompt: 'p2', code: 'c2', createdAt: new Date() },
      ];
      const originalLength = original.length;

      removeComponentById(original, 'a');

      expect(original.length).toBe(originalLength);
    });

    test('마지막 컴포넌트를 제거하면 빈 배열을 반환한다', () => {
      const components: GeneratedComponent[] = [
        { id: 'only', prompt: 'p', code: 'c', createdAt: new Date() },
      ];

      const result = removeComponentById(components, 'only');

      expect(result.length).toBe(0);
    });
  });

  describe('clearAllComponents', () => {
    test('항상 빈 배열을 반환한다', () => {
      const result = clearAllComponents();
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });

    test('배열 타입이 맞다', () => {
      const result = clearAllComponents();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('processSSELines', () => {
    test('token 이벤트 줄에서 delta를 추출한다', () => {
      const lines = ['data: {"type":"token","delta":"const "}'];
      const result = processSSELines(lines);
      expect(result.deltas).toEqual(['const ']);
      expect(result.finalCode).toBeNull();
      expect(result.error).toBeNull();
    });

    test('복수 token 이벤트를 순서대로 반환한다', () => {
      const lines = [
        'data: {"type":"token","delta":"A"}',
        'data: {"type":"token","delta":"B"}',
        'data: {"type":"token","delta":"C"}',
      ];
      const result = processSSELines(lines);
      expect(result.deltas).toEqual(['A', 'B', 'C']);
    });

    test('done 이벤트에서 finalCode를 반환한다', () => {
      const code = 'const X = () => null;\n\nrender(<X />);';
      const lines = [`data: ${JSON.stringify({ type: 'done', code })}`];
      const result = processSSELines(lines);
      expect(result.finalCode).toBe(code);
      expect(result.deltas).toEqual([]);
      expect(result.error).toBeNull();
    });

    test('error 이벤트에서 error 메시지를 반환한다', () => {
      const lines = ['data: {"type":"error","message":"API 에러"}'];
      const result = processSSELines(lines);
      expect(result.error).toBe('API 에러');
      expect(result.deltas).toEqual([]);
      expect(result.finalCode).toBeNull();
    });

    test('빈 줄은 무시한다', () => {
      const lines = ['', 'data: {"type":"token","delta":"hello"}', ''];
      const result = processSSELines(lines);
      expect(result.deltas).toEqual(['hello']);
    });

    test('JSON 파싱 실패 줄은 무시한다 (throw 없음)', () => {
      const lines = ['data: {invalid', 'data: {"type":"token","delta":"ok"}'];
      expect(() => processSSELines(lines)).not.toThrow();
      const result = processSSELines(lines);
      expect(result.deltas).toEqual(['ok']);
    });

    test('token과 done이 함께 있으면 둘 다 처리한다', () => {
      const lines = [
        'data: {"type":"token","delta":"partial"}',
        `data: ${JSON.stringify({ type: 'done', code: 'final' })}`,
      ];
      const result = processSSELines(lines);
      expect(result.deltas).toEqual(['partial']);
      expect(result.finalCode).toBe('final');
    });

    test('빈 배열 입력 시 모두 null/빈 배열을 반환한다', () => {
      const result = processSSELines([]);
      expect(result.deltas).toEqual([]);
      expect(result.finalCode).toBeNull();
      expect(result.error).toBeNull();
    });
  });
});
