/**
 * Global declarations for Maestro JavaScript environment
 * These globals are provided by Maestro at runtime
 */

interface MaestroOutput {
  CURRENT_FLOW_NAME: string
  CURRENT_TEST_RUN_ID: string
  CURRENT_STEP_NUMBER: string
  CURRENT_PLATFORM: string
  METRICS_BUFFER: string
  FLOW_START_TIME?: string
  PARENT_FLOW_NAME?: string
  SUB_FLOW_START_TIME?: string
  [key: string]: string | undefined
}

declare global {
  /**
   * Maestro output object for state persistence between script runs
   */
  const output: MaestroOutput

  /**
   * Environment variables passed from Maestro YAML files
   */
  const FLOW_NAME: string | undefined
  const SUB_FLOW_NAME: string | undefined
  const ACTION: string | undefined
  const TARGET: string | undefined
  const PHASE: 'start' | 'end' | undefined

  /**
   * Console object available in GraalJS
   */
  const console: {
    log(...args: unknown[]): void
    error(...args: unknown[]): void
  }
}

export {}
