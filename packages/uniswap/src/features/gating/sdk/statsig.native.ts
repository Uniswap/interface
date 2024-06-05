// eslint-disable-next-line no-restricted-imports
import { Statsig, StatsigContext } from 'statsig-react-native'
const statsig = Statsig
const statsigContext = StatsigContext

// eslint-disable-next-line no-restricted-imports
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
} from 'statsig-react-native'
export { statsig as Statsig, statsigContext as StatsigContext }
