import { describe, test, expect } from 'bun:test';
import { stripCodeFences, ensureRenderCall } from './codeTransform';

describe('stripCodeFences', () => {
  test('markdown 코드펜스(```)를 제거한다', () => {
    const input = '```jsx\nconst Button = () => <button>Click</button>;\n```';
    const expected = 'const Button = () => <button>Click</button>;';
    expect(stripCodeFences(input)).toBe(expected);
  });

  test('코드펜스 없는 입력은 그대로 반환한다', () => {
    const input = 'const Button = () => <button>Click</button>;';
    expect(stripCodeFences(input)).toBe(input);
  });

  test('여러 줄의 코드펜스를 제거한다', () => {
    const input = '```tsx\nconst MyComponent = () => {\n  return <div>test</div>;\n};\nrender(<MyComponent />);\n```';
    const expected = 'const MyComponent = () => {\n  return <div>test</div>;\n};\nrender(<MyComponent />);';
    expect(stripCodeFences(input)).toBe(expected);
  });

  test('빈 문자열을 입력하면 빈 문자열을 반환한다', () => {
    expect(stripCodeFences('')).toBe('');
  });

  test('시작과 끝의 공백을 제거한다', () => {
    const input = '```javascript\n  const x = 1;  \n```';
    const expected = 'const x = 1;';
    expect(stripCodeFences(input)).toBe(expected);
  });
});

describe('ensureRenderCall', () => {
  test('render() 호출이 없으면 추가한다', () => {
    const input = 'const Button = () => <button>Click</button>;';
    const result = ensureRenderCall(input);
    expect(result).toContain('render(<Button />);');
  });

  test('render() 호출이 이미 있으면 추가하지 않는다', () => {
    const input = 'const Button = () => <button>Click</button>;\n\nrender(<Button />);';
    const result = ensureRenderCall(input);
    expect(result).toBe(input);
  });

  test('컴포넌트 이름을 올바르게 추출하여 render 호출에 사용한다', () => {
    const input = 'function MyCard() {\n  return <div>Card</div>;\n}';
    const result = ensureRenderCall(input);
    expect(result).toContain('render(<MyCard />);');
  });

  test('빈 문자열을 입력하면 그대로 반환한다', () => {
    expect(ensureRenderCall('')).toBe('');
  });

  test('컴포넌트 이름을 찾을 수 없으면 코드를 그대로 반환한다', () => {
    const input = 'const x = () => null;';
    const result = ensureRenderCall(input);
    expect(result).toBe(input);
  });
});
