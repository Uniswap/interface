/**
 * Environment variable utilities for GraalJS/Maestro runtime
 * In Maestro's GraalJS, env vars are exposed as global variables
 */

/**
 * Safely get an environment variable with a default fallback
 */
export function getEnvVar(name: string, defaultValue: string): string {
  // In GraalJS/Maestro, environment variables are available as global variables
  const value = (globalThis as Record<string, unknown>)[name]
  return typeof value !== 'undefined' ? String(value) : defaultValue
}

/**
 * Get required environment variable (throws if not defined)
 */
export function requireEnvVar(name: string): string {
  const value = (globalThis as Record<string, unknown>)[name]
  if (typeof value === 'undefined') {
    throw new Error(`Required environment variable ${name} is not defined`)
  }
  return String(value)
}

/**
 * Check if an environment variable is defined
 */
export function hasEnvVar(name: string): boolean {
  return typeof (globalThis as Record<string, unknown>)[name] !== 'undefined'
}

/**
 * Get all Maestro-specific environment variables
 */
export function getMaestroEnvVars(): Record<string, string> {
  const vars: Record<string, string> = {}
  const knownVars = ['FLOW_NAME', 'SUB_FLOW_NAME', 'ACTION', 'TARGET', 'PHASE']

  for (const varName of knownVars) {
    if (hasEnvVar(varName)) {
      vars[varName] = getEnvVar(varName, '')
    }
  }

  return vars
}
