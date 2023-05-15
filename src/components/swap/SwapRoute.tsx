import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import RoutingDiagram from 'components/RoutingDiagram/RoutingDiagram'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useAutoRouterSupported from 'hooks/useAutoRouterSupported'
import { InterfaceTrade } from 'state/routing/types'
import { Separator, ThemedText } from 'theme'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'

import RouterLabel from './RouterLabel'

export default function SwapRoute({ trade, syncing }: { trade: InterfaceTrade; syncing: boolean }) {
  const { chainId } = useWeb3React()
  const autoRouterSupported = useAutoRouterSupported()

  const routes = getRoutingDiagramEntries(trade)

  const gasPrice =
    // TODO(WEB-3303)
    // Can `trade.gasUseEstimateUSD` be defined when `chainId` is not in `SUPPORTED_GAS_ESTIMATE_CHAIN_IDS`?
    trade.gasUseEstimateUSD && chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)
      ? trade.gasUseEstimateUSD === '0.00'
        ? '<$0.01'
        : '$' + trade.gasUseEstimateUSD
      : undefined

  return (
    <Column gap="md">
      <RouterLabel />
      <Separator />
      {syncing ? (
        <LoadingRows>
          <div style={{ width: '100%', height: '30px' }} />
        </LoadingRows>
      ) : (
        <RoutingDiagram
          currencyIn={trade.inputAmount.currency}
          currencyOut={trade.outputAmount.currency}
          routes={routes}
        />
      )}
      {autoRouterSupported && (
        <>
          <Separator />
          {syncing ? (
            <LoadingRows>
              <div style={{ width: '100%', height: '15px' }} />
            </LoadingRows>
          ) : (
            <ThemedText.Caption color="textSecondary">
              {gasPrice ? <Trans>Best price route costs ~{gasPrice} in gas.</Trans> : null}{' '}
              <Trans>
                This route optimizes your total output by considering split routes, multiple hops, and the gas cost of
                each step.
              </Trans>
            </ThemedText.Caption>
          )}
        </>
      )}
    </Column>
  )
}
