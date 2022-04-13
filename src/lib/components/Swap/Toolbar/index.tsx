import { ALL_SUPPORTED_CHAIN_IDS } from 'constants/chains'
import { useIsAmountPopulated, useSwapInfo } from 'lib/hooks/swap'
import useWrapCallback, { WrapType } from 'lib/hooks/swap/useWrapCallback'
import useActiveWeb3React from 'lib/hooks/useActiveWeb3React'
import { largeIconCss } from 'lib/icons'
import { Field } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'
import { memo, useMemo } from 'react'
import { TradeState } from 'state/routing/types'

import Row from '../../Row'
import Rule from '../../Rule'
import * as Caption from './Caption'

const ToolbarRow = styled(Row)`
  padding: 0.5em 0;
  ${largeIconCss}
`

export default memo(function Toolbar() {
  const { active, activating, chainId } = useActiveWeb3React()
  const {
    [Field.INPUT]: { currency: inputCurrency, balance: inputBalance, amount: inputAmount },
    [Field.OUTPUT]: { currency: outputCurrency, usdc: outputUSDC },
    trade: { trade, state },
    impact,
  } = useSwapInfo()
  const isAmountPopulated = useIsAmountPopulated()
  const { type: wrapType } = useWrapCallback()
  const caption = useMemo(() => {
    if (!active || !chainId) {
      if (activating) return <Caption.Connecting />
      return <Caption.ConnectWallet />
    }

    if (!ALL_SUPPORTED_CHAIN_IDS.includes(chainId)) {
      return <Caption.UnsupportedNetwork />
    }

    if (inputCurrency && outputCurrency && isAmountPopulated) {
      if (state === TradeState.SYNCING || state === TradeState.LOADING) {
        return <Caption.LoadingTrade />
      }
      if (inputBalance && inputAmount?.greaterThan(inputBalance)) {
        return <Caption.InsufficientBalance currency={inputCurrency} />
      }
      if (wrapType !== WrapType.NONE) {
        return <Caption.WrapCurrency inputCurrency={inputCurrency} outputCurrency={outputCurrency} />
      }
      if (state === TradeState.NO_ROUTE_FOUND || (trade && !trade.swaps)) {
        return <Caption.InsufficientLiquidity />
      }
      if (trade?.inputAmount && trade.outputAmount) {
        return <Caption.Trade trade={trade} outputUSDC={outputUSDC} impact={impact} />
      }
      if (state === TradeState.INVALID) {
        return <Caption.Error />
      }
    }

    return <Caption.Empty />
  }, [
    activating,
    active,
    chainId,
    impact,
    inputAmount,
    inputBalance,
    inputCurrency,
    isAmountPopulated,
    outputCurrency,
    outputUSDC,
    state,
    trade,
    wrapType,
  ])

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
})
