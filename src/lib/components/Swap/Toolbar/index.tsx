import { ALL_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import { useSwapInfo } from 'lib/hooks/swap'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { largeIconCss } from 'lib/icons'
import { Field } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { TradeState } from 'state/routing/types'

import Row from '../../Row'
import Rule from '../../Rule'
import * as Caption from './Caption'

const ToolbarRow = styled(Row)`
  padding: 0.5em 0;
  ${largeIconCss}
`

export default function Toolbar({ disabled }: { disabled?: boolean }) {
  const { chainId } = useActiveWeb3React()
  const {
    trade: { trade, state },
    currencies: { [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency },
    currencyBalances: { [Field.INPUT]: balance },
  } = useSwapInfo()

  const [routeFound, routeIsLoading] = useMemo(
    () => [Boolean(trade?.swaps), TradeState.LOADING === state || TradeState.SYNCING === state],
    [state, trade?.swaps]
  )

  const caption = useMemo(() => {
    if (disabled) {
      return <Caption.ConnectWallet />
    }

    if (chainId && !ALL_SUPPORTED_CHAIN_IDS.includes(chainId)) {
      return <Caption.UnsupportedNetwork />
    }

    if (balance && trade?.inputAmount.greaterThan(balance)) {
      return <Caption.InsufficientBalance currency={trade.inputAmount.currency} />
    }

    if (inputCurrency && outputCurrency) {
      if (!trade || routeIsLoading) {
        return <Caption.LoadingTrade />
      }

      if (!routeFound) {
        return <Caption.InsufficientLiquidity />
      }
      if (trade.inputAmount && trade.outputAmount) {
        return <Caption.Trade trade={trade} />
      }
    }

    return <Caption.Empty />
  }, [balance, chainId, disabled, inputCurrency, outputCurrency, routeFound, routeIsLoading, trade])

  return (
    <>
      <Rule />
      <ThemedText.Caption>
        <ToolbarRow justify="flex-start" gap={0.5} iconSize={4 / 3}>
          {caption}
        </ToolbarRow>
      </ThemedText.Caption>
    </>
  )
}
