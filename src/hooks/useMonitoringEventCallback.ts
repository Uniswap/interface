import { useCallback } from 'react'
import ReactGA from 'react-ga'

import { useActiveWeb3React } from './web3'

type MonitoringEvent = 'wallet connected' | 'swap' | 'add liquidity/v3' | 'add liquidity/v2'

export function useMonitoringEventCallback() {
  const { account, chainId } = useActiveWeb3React()

  return useCallback(
    (action: MonitoringEvent, { hash }: { hash?: string } | undefined = {}) => {
      ReactGA.event({
        category: 'Monitoring',
        action,
        label: [
          `walletAddress: ${account}`,
          `chainId: ${chainId}`,
          `timestamp: ${Date.now()}`,
          `hash: ${hash ?? 'n/a'}`,
        ].join(';'),
      })
    },
    [account, chainId]
  )
}
