import { t } from '@lingui/macro'
import { useCallback, useRef } from 'react'
import { buildRoute } from 'services/route'
import { BuildRouteData, BuildRoutePayload } from 'services/route/types/buildRoute'
import { RouteSummary } from 'services/route/types/getRoute'

import { NETWORKS_INFO } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { useKyberswapGlobalConfig } from 'hooks/useKyberswapConfig'

export type BuildRouteResult =
  | {
      data: BuildRouteData
      error?: never
    }
  | {
      data?: never
      error: string
    }

type Args = {
  recipient: string
  routeSummary: RouteSummary | undefined
  slippage: number
  transactionTimeout: number
  skipSimulateTx: boolean
}
const useBuildRoute = (args: Args) => {
  const { recipient, routeSummary, slippage, transactionTimeout, skipSimulateTx } = args
  const { chainId, account } = useActiveWeb3React()
  const abortControllerRef = useRef(new AbortController())
  const { aggregatorDomain } = useKyberswapGlobalConfig()

  const fetcher = useCallback(async (): Promise<BuildRouteResult> => {
    if (!account) {
      return {
        error: t`Wallet is not connected`,
      }
    }

    if (!routeSummary) {
      return {
        error: t`Route summary is missing`,
      }
    }

    const payload: BuildRoutePayload = {
      routeSummary,
      deadline: Math.floor(Date.now() / 1000) + transactionTimeout,
      slippageTolerance: slippage,
      sender: account,
      recipient: recipient || account,
      source: 'kyberswap',
      skipSimulateTx,
    }

    try {
      abortControllerRef.current.abort()
      abortControllerRef.current = new AbortController()

      const url = `${aggregatorDomain}/${NETWORKS_INFO[chainId].aggregatorRoute}/api/v1/route/build`
      const response = await buildRoute(url, payload, abortControllerRef.current.signal)

      return {
        data: response,
      }
    } catch (e) {
      return {
        error: e.message || t`Something went wrong`,
      }
    }
  }, [account, aggregatorDomain, chainId, recipient, routeSummary, skipSimulateTx, slippage, transactionTimeout])

  return fetcher
}

export default useBuildRoute
