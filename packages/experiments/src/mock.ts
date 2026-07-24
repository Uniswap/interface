import { getExperimentsClient } from './client'
import type { ExperimentsClient } from './client'

/**
 * Reserved `x-experiments` key carrying an integration-test mock directive to
 * the backend. Mirrors the backend constant in
 * `packages/lib/middlewares/server/mockScenario.ts` (repo: Uniswap/backend) —
 * change both together.
 *
 * The backend honors this ONLY in non-production environments (gated by
 * `isProd()` in its `mockScenarioInterceptor`); production ignores it, so a
 * stray directive is harmless.
 */
export const MOCK_EXPERIMENT_KEY = '__mock__'

/** Selects a backend-registered mock scenario, with optional scenario args. */
export interface MockDirective {
  scenario: string
  args?: Record<string, unknown>
}

/**
 * Ask the backend to serve a registered mock scenario for subsequent API
 * calls, by writing the reserved `__mock__` directive into the active
 * experiments set so it rides the existing `x-experiments` transport.
 *
 * Intended for live integration tests against dev/staging. Pass an isolated
 * client (from `createExperimentsClient`) in unit tests; defaults to the shared
 * client the Trading fetch client reads. Writes are first-write-wins — call
 * `client.clear()` before requesting a different scenario in the same session.
 */
export function requestMockScenario(
  directive: MockDirective,
  client: ExperimentsClient = getExperimentsClient(),
): void {
  client.set(MOCK_EXPERIMENT_KEY, {
    value: {
      scenario: directive.scenario,
      ...(directive.args ? { args: directive.args } : {}),
    },
  })
}
