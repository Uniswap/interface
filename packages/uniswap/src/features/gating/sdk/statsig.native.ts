import { Statsig, StatsigContext } from 'statsig-react-native'
const statsig = Statsig
const statsigContext = StatsigContext

export {
  DynamicConfig,
  useConfig,
  useExperiment,
  useExperimentWithExposureLoggingDisabled,
  useGate,
  useGateWithExposureLoggingDisabled,
} from 'statsig-react-native'
export { statsig as Statsig, statsigContext as StatsigContext }
