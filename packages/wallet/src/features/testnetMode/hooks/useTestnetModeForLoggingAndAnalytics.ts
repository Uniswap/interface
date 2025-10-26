import { useEffect } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { WALLET_TESTNET_CONFIG } from 'uniswap/src/features/telemetry/constants'
import { setAttributesToDatadog } from 'utilities/src/logger/datadog/Datadog'
// biome-ignore lint/style/noRestrictedImports: Hook needs direct selector access for testnet mode state
import { analytics } from 'utilities/src/telemetry/analytics/analytics'

export function useTestnetModeForLoggingAndAnalytics(): void {
  const { isTestnetModeEnabled } = useEnabledChains()
  useEffect(() => {
    analytics.setTestnetMode(isTestnetModeEnabled, WALLET_TESTNET_CONFIG)
    setAttributesToDatadog({ testnetMode: isTestnetModeEnabled }).catch(() => undefined)
  }, [isTestnetModeEnabled])
}
