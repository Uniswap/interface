import type { ActionMetric, FlowEndMetric, FlowStartMetric, SubFlowEndMetric, SubFlowStartMetric } from '../types'

interface BaseMetricParams {
  timestamp: number
  platform: string
  testRunId: string
}

/**
 * Create a flow start metric
 */
export function createFlowStartMetric(params: BaseMetricParams & { flowName: string }): FlowStartMetric {
  return {
    event: 'flow_start',
    flowName: params.flowName,
    timestamp: params.timestamp,
    platform: params.platform,
    testRunId: params.testRunId,
  }
}

/**
 * Create a flow end metric
 */
export function createFlowEndMetric(
  params: BaseMetricParams & {
    flowName: string
    duration: number
    status: 'success' | 'failure'
  },
): FlowEndMetric {
  return {
    event: 'flow_end',
    flowName: params.flowName,
    timestamp: params.timestamp,
    duration: params.duration,
    status: params.status,
    platform: params.platform,
    testRunId: params.testRunId,
  }
}

/**
 * Create a sub-flow start metric
 */
export function createSubFlowStartMetric(
  params: BaseMetricParams & {
    parentFlowName: string
    subFlowName: string
  },
): SubFlowStartMetric {
  return {
    event: 'sub_flow_start',
    parentFlowName: params.parentFlowName,
    subFlowName: params.subFlowName,
    timestamp: params.timestamp,
    platform: params.platform,
    testRunId: params.testRunId,
  }
}

/**
 * Create a sub-flow end metric
 */
export function createSubFlowEndMetric(
  params: BaseMetricParams & {
    parentFlowName: string
    subFlowName: string
    duration: number
    status: 'success' | 'failure'
  },
): SubFlowEndMetric {
  return {
    event: 'sub_flow_end',
    parentFlowName: params.parentFlowName,
    subFlowName: params.subFlowName,
    timestamp: params.timestamp,
    duration: params.duration,
    status: params.status,
    platform: params.platform,
    testRunId: params.testRunId,
  }
}

/**
 * Create an action metric
 */
export function createActionMetric(
  params: BaseMetricParams & {
    flowName: string
    actionType: string
    actionTarget: string
    stepNumber: number
    duration: number
    status: 'success' | 'failure'
  },
): ActionMetric {
  return {
    type: 'action',
    flowName: params.flowName,
    actionType: params.actionType,
    actionTarget: params.actionTarget,
    stepNumber: params.stepNumber,
    duration: params.duration,
    timestamp: params.timestamp,
    status: params.status,
    platform: params.platform,
    testRunId: params.testRunId,
  }
}
