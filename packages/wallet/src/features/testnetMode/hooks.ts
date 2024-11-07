import { useEffect } from 'react'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { WALLET_TESTNET_CONFIG } from 'uniswap/src/features/telemetry/constants'
import { setAttributesToDatadog } from 'utilities/src/logger/Datadog'
import { Sentry } from 'utilities/src/logger/Sentry'
// eslint-disable-next-line no-restricted-imports
import { analytics } from 'utilities/src/telemetry/analytics/analytics'

export function useTestnetModeForLoggingAndAnalytics(): void {
  const { isTestnetModeEnabled } = useEnabledChains()
  const datadogEnabled = useFeatureFlag(FeatureFlags.Datadog)
  useEffect(() => {
    analytics.setTestnetMode(isTestnetModeEnabled, WALLET_TESTNET_CONFIG)
    if (datadogEnabled) {
      setAttributesToDatadog({ testnetMode: isTestnetModeEnabled }).catch(() => undefined)
    } else {
      Sentry.setTag('testnetMode', isTestnetModeEnabled)
    }
  }, [datadogEnabled, isTestnetModeEnabled])
}
