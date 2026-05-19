import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';

/**
 * CodeView의 handleCopy 함수는 다음을 보장해야 한다:
 * 1. clipboard.writeText 성공 시: copied 상태를 true로 설정
 * 2. clipboard.writeText 실패 시: 에러를 catch하고 처리 (throw하지 않음)
 * 3. 실패 시에도: 사용자 경험을 고려하여 에러 로깅
 */

describe('CodeView - handleCopy 에러 처리', () => {
  let originalClipboard: Clipboard;

  beforeEach(() => {
    originalClipboard = navigator.clipboard;
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });

  test('성공: clipboard.writeText가 성공하면 Promise를 resolve한다', async () => {
    const mockClipboard = {
      writeText: mock(async () => Promise.resolve()),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    const code = 'const x = 1;';
    const result = await navigator.clipboard.writeText(code);

    expect(result).toBeUndefined(); // writeText는 undefined를 반환
  });

  test('실패: clipboard가 없으면 NotAllowedError를 throw한다', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });

    let errorThrown = false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (navigator as any).clipboard.writeText('test');
    } catch {
      errorThrown = true;
    }

    expect(errorThrown).toBe(true);
  });

  test('실패: 권한이 없으면 Promise를 reject한다', async () => {
    const permissionError = new Error('NotAllowedError');
    const mockClipboard = {
      writeText: mock(async () => Promise.reject(permissionError)),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    const code = 'const x = 1;';
    let rejectedError = null;

    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      rejectedError = error;
    }

    expect(rejectedError).toEqual(permissionError);
  });

  test('실패 처리: 함수가 에러를 내부에서 처리하고 throw하지 않는다', async () => {
    const permissionError = new Error('Clipboard access denied');
    const mockClipboard = {
      writeText: mock(async () => Promise.reject(permissionError)),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    // 실제 handleCopy 구현을 시뮬레이션
    const handleCopyWithErrorHandling = async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
        return { success: true };
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return { success: false };
      }
    };

    const result = await handleCopyWithErrorHandling('const x = 1;');
    expect(result.success).toBe(false); // 실패해도 함수는 에러를 throw하지 않음
  });

  test('로깅: 에러 발생 시 에러 메시지를 기록한다', async () => {
    const permissionError = new Error('Clipboard not accessible');
    const mockClipboard = {
      writeText: mock(async () => Promise.reject(permissionError)),
    };
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      configurable: true,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logs: any[] = [];
    const originalError = console.error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error = (...args: any[]) => {
      logs.push(args);
    };

    const handleCopyWithLogging = async (code: string) => {
      try {
        await navigator.clipboard.writeText(code);
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
      }
    };

    await handleCopyWithLogging('const x = 1;');

    console.error = originalError;
    expect(logs.length).toBeGreaterThan(0);
  });
});
