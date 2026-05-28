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
 * Node process runtime mode. Mirrors the Node.js `NODE_ENV` convention
 * May match Environment but not necessarily.
 */
export enum NodeEnv {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}
