/**
 * Type definitions for Maestro E2E Performance Tracking
 */

/**
 * Maestro output object for storing variables between script executions
 */
export interface MaestroOutput {
  CURRENT_FLOW_NAME: string
  CURRENT_TEST_RUN_ID: string
  CURRENT_STEP_NUMBER: string
  CURRENT_PLATFORM: string
  METRICS_BUFFER: string
  FLOW_START_TIME?: string
  PARENT_FLOW_NAME?: string
  SUB_FLOW_START_TIME?: string
  [key: string]: string | undefined // Allow dynamic action start times
}

/**
 * Base metric structure
 */
export interface BaseMetric {
  timestamp: number
  platform: string
  testRunId: string
}

/**
 * Flow start event metric
 */
export interface FlowStartMetric extends BaseMetric {
  event: 'flow_start'
  flowName: string
}

/**
 * Flow end event metric
 */
export interface FlowEndMetric extends BaseMetric {
  event: 'flow_end'
  flowName: string
  duration: number
  status: 'success' | 'failure'
}

/**
 * Sub-flow start event metric
 */
export interface SubFlowStartMetric extends BaseMetric {
  event: 'sub_flow_start'
  parentFlowName: string
  subFlowName: string
}

/**
 * Sub-flow end event metric
 */
export interface SubFlowEndMetric extends BaseMetric {
  event: 'sub_flow_end'
  parentFlowName: string
  subFlowName: string
  duration: number
  status: 'success' | 'failure'
}

/**
 * Action metric for UI interactions
 */
export interface ActionMetric extends BaseMetric {
  type: 'action'
  flowName: string
  actionType: string
  actionTarget: string
  stepNumber: number
  duration: number
  status: 'success' | 'failure'
}

/**
 * Union type of all metric types
 */
export type Metric = FlowStartMetric | FlowEndMetric | SubFlowStartMetric | SubFlowEndMetric | ActionMetric
