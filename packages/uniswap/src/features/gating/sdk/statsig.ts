import { Statsig, StatsigContext } from 'statsig-react'
const statsig = Statsig
const statsigContext = StatsigContext

export {
  DynamicConfig,
  useConfig,
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'statsig-react'
export { statsig as Statsig, statsigContext as StatsigContext }
