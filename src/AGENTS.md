# src/AGENTS.md — 프론트엔드 규칙

루트 `AGENTS.md`의 Golden Rules가 여기에도 적용된다. 중복 내용은 생략.

## Module Context

Vite + React 19 + TypeScript 프론트엔드. `useComponentGenerator` 훅이 상태와 API 호출을 담당하고, 컴포넌트는 UI 렌더링만 처리한다.

## Tech Stack & Constraints

- react-live `^4.1.8`: 생성된 코드를 브라우저에서 직접 실행. LivePreview 수정 시 react-live API 참조.
- TypeScript strict 모드 활성화 (`tsconfig.app.json`). `any` 타입 사용 금지.
- CSS 모듈, Tailwind 없음 — 앱 자체 스타일은 `App.css`와 인라인 스타일 사용.

## Implementation Patterns

**훅 패턴:**
```typescript
// src/hooks/useXxx.ts
export function useXxx(): UseXxxReturn {
  // 상태, 콜백을 정의하고 반환
}
```

**컴포넌트 패턴:**
- Props 타입은 컴포넌트 파일 내에 인라인으로 정의한다 (공유 타입은 `src/types/index.ts`).
- `useCallback`으로 이벤트 핸들러를 메모이제이션한다.

**타입 추가:**
- 공유 타입은 `src/types/index.ts`에만 추가한다.
- `Provider` 타입에 새 프로바이더 추가 시 서버 측 `server/AGENTS.md` 참조.

## react-live 핵심 제약

생성된 컴포넌트 코드(`GeneratedComponent.code`)는 react-live의 `LiveProvider`에서 실행된다:
- `React`는 전역 스코프에 존재 — import 불필요.
- `render(<ComponentName />)` 호출이 코드 마지막에 있어야 미리보기가 작동한다.
- TypeScript 문법(타입 어노테이션, 인터페이스, `as` 캐스트 등)이 포함되면 파싱 에러 발생.
- CSS import, 외부 라이브러리 import는 실행 환경에 없으므로 에러 발생.

## Local Golden Rules

**Do's:**
- `LivePreview.tsx` 수정 시 `LiveProvider`의 `scope` prop에 필요한 전역 변수를 추가한다.
- 에러 바운더리는 `LiveError` 컴포넌트가 담당 — 별도로 추가하지 않는다.

**Don'ts:**
- `App.tsx`에서 직접 fetch를 호출하지 마라 — `useComponentGenerator` 훅을 통해서만.
- `ComponentCard.tsx`에 상태를 추가하지 마라 — 표시 전용 컴포넌트.
- `useComponentGenerator` 외부에서 `components` 배열을 직접 조작하지 마라.
