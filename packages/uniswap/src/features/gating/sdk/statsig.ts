/* eslint-disable @typescript-eslint/no-restricted-imports */
import { Statsig, StatsigContext } from 'statsig-react'
const statsig = Statsig
const statsigContext = StatsigContext

export {
  DynamicConfig,
  StatsigOptions,
  StatsigOverrides,
  StatsigProvider,
  StatsigUser,
  useConfig,
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'statsig-react'
export { statsig as Statsig, statsigContext as StatsigContext }
