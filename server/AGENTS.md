# server/AGENTS.md — Bun API 서버 규칙

루트 `AGENTS.md`의 Golden Rules가 여기에도 적용된다. 중복 내용은 생략.

## Module Context

Bun 런타임 기반 API 프록시 서버 (포트 3002). AI API 키를 클라이언트에 노출하지 않고 중계하며, 생성 코드 후처리(코드 펜스 제거, render 호출 보장)를 담당한다.

## Tech Stack & Constraints

- Bun 런타임: `Bun.serve()` 사용. Express, Fastify 등 추가 금지.
- `@types/bun` 타입 사용 — Node.js `http` 모듈 사용 금지.
- 외부 HTTP 클라이언트(axios 등) 사용 금지 — 내장 `fetch`만 사용.

## Implementation Patterns

**새 AI 프로바이더 추가 절차:**
1. `src/types/index.ts`의 `Provider` 타입에 추가.
2. `ENV_KEYS` 레코드에 환경변수 키 추가.
3. `callXxx(prompt, apiKey)` 함수 구현 — `callAnthropic` / `callGoogle` 패턴 참조.
4. `/api/generate` 라우트의 provider 분기에 추가.

**에러 처리 패턴:**
- HTTP 상태 코드별 사용자 친화적 한국어 메시지 반환 (429, 503 등).
- `err instanceof Error ? err.message : 'Unknown error'` 패턴 유지.

**코드 후처리 파이프라인 (`stripCodeFences` → `ensureRenderCall`):**
- AI가 마크다운 코드 펜스를 포함해 응답하면 `stripCodeFences`가 제거.
- `render()` 호출이 없으면 `ensureRenderCall`이 자동 추가.
- 이 파이프라인 순서를 변경하거나 단계를 건너뛰지 마라.

## SYSTEM_PROMPT 수정 규칙

`SYSTEM_PROMPT`를 수정할 때 반드시 지켜야 할 불변 제약:
- "Use inline styles only" 유지 — react-live 환경에서 CSS import 불가.
- "Do NOT use import statements" 유지 — React는 이미 전역 스코프.
- "Do NOT use TypeScript syntax" 유지 — react-live는 JSX transformer만 사용.
- "call render(<ComponentName />) at the end" 유지 — LivePreview 렌더링 필수 조건.

## API 엔드포인트

- `GET /api/config` — `envKeys: { anthropic: boolean, google: boolean }` 반환. 키 값 자체는 절대 노출 금지.
- `POST /api/generate` — 요청: `{ prompt, apiKey?, provider? }`, 응답: `{ code }`.

## Local Golden Rules

**Do's:**
- API 키 유효성 확인은 `resolveApiKey()` 함수로만 처리한다.
- CORS 헤더는 `CORS_HEADERS` 상수를 재사용한다.

**Don'ts:**
- `ENV_KEYS`에서 실제 키 값을 클라이언트 응답에 포함하지 마라 — 존재 여부(`boolean`)만 반환.
- 서버에 상태(state)를 저장하지 마라 — stateless 유지.
- `Bun.serve()` 외부에 별도 HTTP 서버를 추가하지 마라.
