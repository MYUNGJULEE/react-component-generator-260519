# AGENTS.md

## Operational Commands

패키지 매니저: **bun 고정** — npm, yarn, pnpm 절대 사용 금지.

```
bun install                # 의존성 설치
bun run dev                # Vite + API 서버 동시 실행 (개발)
bun run server             # API 서버만 실행 (watch 모드, 포트 3002)
bun run build              # 프로덕션 빌드 (tsc -b && vite build)
bun run lint               # ESLint 실행
bun preview                # 빌드 결과 미리보기
```

서버는 포트 3002, Vite는 기본 포트 5173. Vite는 `/api` 요청을 자동으로 3002로 프록시.

## Golden Rules

**Immutable (절대 위반 금지):**
- API 키를 코드에 하드코딩하지 마라. 반드시 환경변수 또는 클라이언트 런타임 입력을 사용한다.
- `server/index.ts`의 `SYSTEM_PROMPT`를 수정할 때는 생성 코드 제약(inline styles, no imports, render() 필수)을 반드시 유지한다.
- react-live 환경에서 실행되는 생성 코드는 TypeScript 문법을 포함해서는 안 된다.

**Do's:**
- 환경변수는 `.env` 파일에서만 관리한다 (`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`).
- 새 AI 프로바이더 추가 시 `Provider` 타입 (`src/types/index.ts`)과 서버 라우팅을 함께 수정한다.
- 컴포넌트 상태 관리는 `useComponentGenerator` 훅에서만 처리한다.

**Don'ts:**
- `.env` 파일을 커밋하지 마라.
- 생성된 컴포넌트 코드에 CSS 파일, CSS 모듈, 외부 import를 추가하지 마라.
- `App.tsx`에 직접 비즈니스 로직을 추가하지 마라 — 훅으로 분리한다.

## Project Context

자연어 프롬프트로 React 컴포넌트를 생성하고, 실시간 미리보기와 코드를 제공하는 웹 앱.

Tech Stack: React 19, TypeScript, Vite, Bun, react-live, Anthropic Claude API, Google Gemini API

## Standards & References

**커밋 메시지 포맷:** `feat/fix/refactor/chore(scope): 한국어 요약`

**코딩 컨벤션:**
- 훅: `use` 접두사, `src/hooks/` 디렉토리
- 컴포넌트: PascalCase, `src/components/` 디렉토리
- 타입: `src/types/index.ts`에 중앙 관리

**Maintenance Policy:** 이 파일의 규칙이 코드와 괴리가 생기면 즉시 업데이트를 제안하라.

## Context Map

- **[프론트엔드 컴포넌트 / 훅 수정 (FE)](./src/AGENTS.md)** — React 컴포넌트, 훅, 타입 작업 시.
- **[API 서버 / 코드 생성 로직 수정 (BE)](./server/AGENTS.md)** — Bun 서버, AI API 연동, SYSTEM_PROMPT 수정 시.
