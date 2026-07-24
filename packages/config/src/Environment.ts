// Enum representing environment types
// Defined here instead of @universe/environment to avoid circular dependencies

/**
 * Backend / deployment environment. Selects which upstream to hit.
 *
 * Orthogonal to {@link NodeEnv} — e.g. NodeEnv.Test against Environment.Staging
 * is a normal config when running tests against a staging backend.
 */
export enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
}

/**
 * Short-form deployment aliases → canonical {@link Environment} values.
 *
 * The backend shared deployer injects `ENVIRONMENT=<stack name>`
 * (`dev`/`staging`/`prod`) on every ECS container, while the canonical enum
 * uses long-form values.
 */
const ENVIRONMENT_WIRE_ALIASES: Record<string, Environment> = {
  dev: Environment.Development,
  prod: Environment.Production,
}

/**
 * Normalizes short-form wire aliases (`dev`, `prod`) to canonical
 * {@link Environment} values. Non-alias values pass through unchanged so
 * unknown environments still fail enum validation.
 */
export function normalizeEnvironmentWireValue(value: unknown): unknown {
  return typeof value === 'string' ? (ENVIRONMENT_WIRE_ALIASES[value] ?? value) : value
}

/**
 * Node process runtime mode. Mirrors the Node.js `NODE_ENV` convention
 * May match Environment but not necessarily.
 */
export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}
