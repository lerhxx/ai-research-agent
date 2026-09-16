---
name: vitest4-troubleshooting
description: "Troubleshoot Vitest 4 test runtime failures in this workspace. USE WHEN tests fail with 'describe is not defined', '.env variables not loaded / process.env.X is undefined', or 'Test timed out in 5000ms'. Covers globals config, env injection via loadEnv, and integration test timeout strategy."
---

# Vitest 4 Troubleshooting

This workspace uses **Vitest 4.x** (`vitest@~4.1.10`) with Vite 8.x. Vitest 4 introduced breaking changes that affect test runtime. This skill covers the three most common failures encountered in this repo.

## 1. `ReferenceError: describe is not defined`

### Cause

Vitest 4 defaults `test.globals` to `false`. Without `globals: true`, test files must explicitly `import { describe, it, expect } from 'vitest'`. If they rely on globals (like Jest), the runtime throws.

This is especially common in **workspace/projects mode** (`test.projects` glob), where root-level `globals` may not propagate to sub-projects.

### Fix

Set `globals: true` in the root Vitest config:

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
  },
});
```

Also update `tsconfig.spec.json` to use Vitest's global types instead of Jest's:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "node"]
  }
}
```

> Note: In this repo, `apps/*` uses Jest (separate `jest.config.cts`), while `libs/*` uses Vitest. Only change `libs/tsconfig.spec.json`, not the apps' tsconfigs.

## 2. `.env` variables not loaded (`process.env.X is undefined`)

### Cause

Vitest 4 **removed** automatic `.env` loading (the `test.envDir` and `test.envPrefix` options no longer exist in the type definitions). Even if `.env` sits in the project root and Vite's `loadEnv` can parse it, Vitest does not inject those variables into `process.env` for the test runtime.

### Verification

Write a temporary debug spec to confirm:

```ts
import { describe, it } from 'vitest';

describe('env debug', () => {
  it('prints env presence', () => {
    console.log('CWD =', process.cwd());
    console.log('MY_VAR present =', !!process.env.MY_VAR);
  });
});
```

If `present = false`, `.env` is not being loaded.

### Fix

Use Vite's `loadEnv` to explicitly read `.env` and inject via `test.env`:

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';  // import from 'vite', NOT 'vitest/config'

export default defineConfig(({ mode }) => {
  // Third arg '' = load ALL variables, not just VITE_-prefixed ones
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      globals: true,
      env,
      include: ['libs/**/*.{test,spec}.ts'],
    },
  };
});
```

Key points:
- `loadEnv` must be imported from `vite`, not `vitest/config` (v4 does not re-export it).
- The third argument `''` disables the `VITE_` prefix filter, so variables like `DEEPSEEK_API_KEY` are loaded.
- Shell-exported variables take precedence over `.env` values (Vite's `loadEnv` default), so `DEEPSEEK_API_KEY=xxx pnpm vitest run` still works for overrides.

## 3. `Test timed out in 5000ms`

### Cause

Vitest's default `testTimeout` is **5000ms**. Integration tests that make real API calls (e.g., DeepSeek, OpenAI) routinely exceed this due to network latency — observed latency in this repo ranges from 1.8s to 30s for the same call.

### Fix Strategy

**Do NOT** raise `testTimeout` globally (it slows failure feedback for unit tests). Instead, apply per-test:

```ts
describe('DeepSeekClient', () => {
  it('should generate a response', async () => {
    // ... test body ...
  }, 30_000);  // 30s timeout for this integration test only
});
```

For API integration tests, also limit `maxTokens` to keep generation time stable:

```ts
const result = await client.chat(
  [{ role: 'user', content: 'some prompt' }],
  { maxTokens: 100 },  // connectivity test doesn't need long output
);
```

### Diagnostic approach

If a test times out but you suspect the call actually completed, add timestamps:

```ts
it('measures latency', async () => {
  const start = Date.now();
  const el = () => `${((Date.now() - start) / 1000).toFixed(1)}s`;
  console.log(el(), 'start call');
  const result = await client.chat([...], { maxTokens: 16 });
  console.log(el(), 'resolved, len =', result.content?.length);
}, 60_000);
```

If stdout shows the response was logged but the test still timed out, the issue is generation latency, not a hung connection.

## Reference config

The final working `vitest.config.mts` for this repo:

```ts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    test: {
      globals: true,
      env,
      include: ['libs/**/*.{test,spec}.ts'],
    },
  };
});
```

## Common pitfalls

- **`projects` workspace mode**: The Nx `@nx/vitest` generator scaffolds `test.projects` with globs like `**/vite.config.{...}`. If no sub-project configs exist, tests run in a default project where root-level `env`/`envDir` settings may not apply. Replace with a flat config if only one test project is needed.
- **`loadEnv` import source**: `vitest/config` in v4 does NOT export `loadEnv`. Import from `vite` directly.
- **Jest vs Vitest type split**: `libs/tsconfig.spec.json` should use `vitest/globals`; `apps/*/tsconfig.spec.json` should keep `jest`. Don't mix them up.
