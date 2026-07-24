// The wire contract — types shared verbatim with the backend.
export type {
  ExperimentCollision,
  ExperimentCollisionReporter,
  ExperimentCollisionSource,
  ExperimentOverride,
  ExperimentsMap,
} from './types'

// Codec — the only place that knows the header name and JSON shape.
export { EXPERIMENTS_HEADER_NAME, parseExperimentsHeader, serializeExperimentsHeader } from './codec'

// Client — the active-experiments store plus the two transport ends (toHeaders / absorb).
export type { ExperimentsClient, ExperimentsClientConfig } from './client'
export { configureExperiments, createExperimentsClient, getExperimentsClient } from './client'

// Typed experiment definitions — define once, read with a typed value.
export type { ExperimentDefinition } from './experiment'
export { experiment } from './experiment'

// React bindings — read the active set (BE→FE) and inject a client.
export { ExperimentsProvider } from './react/ExperimentsProvider'
export type { TypedExperimentOverride } from './react/useExperiment'
export { useExperiment } from './react/useExperiment'
export { useExperimentsClient } from './react/useExperimentsClient'

// gating bridge — read an experiment and (optionally) propagate it to the backend (FE→BE).
export { useExperimentValue } from './bridge/useExperimentValue'

// Integration-test tooling — request a backend mock scenario over the x-experiments transport.
export type { MockDirective } from './mock'
export { MOCK_EXPERIMENT_KEY, requestMockScenario } from './mock'
