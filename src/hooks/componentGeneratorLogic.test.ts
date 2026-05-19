import { describe, test, expect } from 'bun:test';
import type { GeneratedComponent } from '../types';
import {
  generateComponentId,
  createNewComponent,
  addComponent,
  removeComponentById,
  clearAllComponents,
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
});
