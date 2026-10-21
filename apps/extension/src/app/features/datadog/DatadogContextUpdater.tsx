import { datadogRum } from '@datadog/browser-rum'
import { useQuery } from '@tanstack/react-query'
import { provideUniswapIdentifierService } from '@universe/api'
import { uniswapIdentifierQuery } from '@universe/sessions'
import { useEffect } from 'react'
import { ExtensionUserPropertyName } from 'uniswap/src/features/telemetry/user'
import { useDatadogWalletContext } from 'wallet/src/features/datadog/useDatadogWalletContext'
import { useActiveAccount } from 'wallet/src/features/wallet/hooks'

/**
 * Every Datadog field the extension publishes. Redux state never leaves the device, so this file is
 * the whole allowlist: adding a field is a change here, which @uniswap/security owns in CODEOWNERS.
 */
export function DatadogContextUpdater(): null {
  // The browser SDK keeps global context set before `init`, so no readiness gate is needed here.
  useDatadogWalletContext({ isInitialized: true })

  const activeAccount = useActiveAccount()
  const { data: uniswapIdentifier } = useQuery(uniswapIdentifierQuery(provideUniswapIdentifierService))

  useEffect(() => {
    datadogRum.setUserProperty(ExtensionUserPropertyName.ActiveWalletAddress, activeAccount?.address)
  }, [activeAccount?.address])

  useEffect(() => {
    if (uniswapIdentifier) {
      datadogRum.setUserProperty(ExtensionUserPropertyName.UniswapIdentifier, uniswapIdentifier)
    }
  }, [uniswapIdentifier])

  return null
}
