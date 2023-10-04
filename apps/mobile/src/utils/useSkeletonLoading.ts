import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useEffect, useState } from 'react'
import { useExperiment } from 'statsig-react-native'
import { logger } from 'utilities/src/logger/logger'
import { useTimeout } from 'utilities/src/time/timing'
import { EXPERIMENT_NAMES } from 'wallet/src/features/experiments/constants'

const TIMEOUT_MS = 5000

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NavigationProp = NativeStackNavigationProp<any, any, any | undefined>

export function useSkeletonLoading(navigation: NavigationProp): boolean {
  const experiment = useExperiment(EXPERIMENT_NAMES.SkeletonLoading)
  const focusBasedEnabled = !!experiment.config.getValue('enable_focus_based')
  const transitionBasedEnabled = !!experiment.config.getValue('enable_transition_based')
  const timeoutBasedEnabled = !!experiment.config.getValue('enable_timeout_based')
  const [enabled, setEnabled] = useState(
    focusBasedEnabled || transitionBasedEnabled || timeoutBasedEnabled
  )

  useTimeout(() => {
    if (enabled) {
      setEnabled(false)
      logger.warn(
        'useSkeletonLoading',
        'useSkeletonLoading',
        'Timeout reached to disable enabled state'
      )
    }
  }, TIMEOUT_MS)

  useEffect(() => {
    if (focusBasedEnabled) {
      return navigation.addListener('focus', () => setEnabled(false))
    } else if (transitionBasedEnabled) {
      return navigation.addListener('transitionEnd', () => setEnabled(false))
    } else if (timeoutBasedEnabled) {
      setTimeout(() => setEnabled(false), 0)
    }
  }, [navigation, focusBasedEnabled, transitionBasedEnabled, timeoutBasedEnabled])

  return enabled
}
