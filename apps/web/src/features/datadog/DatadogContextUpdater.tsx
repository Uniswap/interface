import { datadogRum } from '@datadog/browser-rum'
import { useQuery } from '@tanstack/react-query'
import { provideUniswapIdentifierService } from '@universe/api'
import { uniswapIdentifierQuery } from '@universe/sessions'
import { useEffect } from 'react'
import { InterfaceUserPropertyName } from 'uniswap/src/features/telemetry/user'
import { useAccount } from '~/hooks/useAccount'

/**
 * Every Datadog user property web publishes. Redux state never leaves the device, so this file is
 * the whole allowlist: adding a field is a change here, which @uniswap/security owns in CODEOWNERS.
 */
export function DatadogContextUpdater(): null {
  const account = useAccount()
  const { data: uniswapIdentifier } = useQuery(uniswapIdentifierQuery(provideUniswapIdentifierService))

  useEffect(() => {
    datadogRum.setUserProperty('connection', {
      type: account.connector?.type,
      name: account.connector?.name,
      rdns: account.connector?.id,
      address: account.address,
      status: account.status,
    })
  }, [account])

  useEffect(() => {
    if (uniswapIdentifier) {
      datadogRum.setUserProperty(InterfaceUserPropertyName.UniswapIdentifier, uniswapIdentifier)
    }
  }, [uniswapIdentifier])

  return null
}
