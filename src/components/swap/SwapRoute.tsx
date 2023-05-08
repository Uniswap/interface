import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import { LoadingRows } from 'components/Loader/styled'
import RoutingDiagram from 'components/RoutingDiagram/RoutingDiagram'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useAutoRouterSupported from 'hooks/useAutoRouterSupported'
import { InterfaceTrade } from 'state/routing/types'
import { Separator, ThemedText } from 'theme'
import getTokenPath from 'utils/getTokenPath'

import RouterLabel from './RouterLabel'

export default function SwapRoute({
  trade,
  syncing,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  syncing: boolean
}) {
  const autoRouterSupported = useAutoRouterSupported()
  const routes = getTokenPath(trade)
  const { chainId } = useWeb3React()

  const formattedGasPriceString = trade.gasUseEstimateUSD
    ? trade.gasUseEstimateUSD.toFixed(2) === '0.00'
      ? '<$0.01'
      : '$' + trade.gasUseEstimateUSD.toFixed(2)
    : undefined

  return (
    <Column gap="md">
      <RouterLabel />
      <Separator />
      {syncing ? (
        <LoadingRows>
          <div style={{ width: '400px', height: '30px' }} />
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
              <div style={{ width: '250px', height: '15px' }} />
            </LoadingRows>
          ) : (
            <ThemedText.Caption color="textSecondary">
              {trade?.gasUseEstimateUSD && chainId && SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId) ? (
                <Trans>Best price route costs ~{formattedGasPriceString} in gas. </Trans>
              ) : null}{' '}
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
