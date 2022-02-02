import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { AlertTriangle, Info, Spinner } from 'lib/icons'
import { ThemedText } from 'lib/theme'
import { useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { TextButton } from '../../Button'
import Row from '../../Row'
import RoutingTooltip from './RoutingTooltip'

export function ConnectWallet() {
  return (
    <>
      <AlertTriangle color="secondary" />
      <Trans>Connect wallet to swap</Trans>
    </>
  )
}

export function Empty() {
  return (
    <>
      <Info color="secondary" />
      <Trans>Enter an amount</Trans>
    </>
  )
}

export function UnsupportedNetwork() {
  return (
    <>
      <AlertTriangle color="secondary" />
      <Trans>Unsupported network&#8211;switch to another to trade.</Trans>
    </>
  )
}

export function InsufficientBalance({ currency }: { currency: Currency }) {
  return (
    <>
      <AlertTriangle color="secondary" />
      <Trans>Insufficient {currency?.symbol}</Trans>
    </>
  )
}

export function InsufficientLiquidity() {
  return (
    <>
      <AlertTriangle color="secondary" />
      <Trans>Insufficient liquidity for this trade.</Trans>
    </>
  )
}

export function LoadingTrade() {
  return (
    <>
      <Spinner color="secondary" />
      <Trans>Fetching best price…</Trans>
    </>
  )
}

export function Trade({ trade }: { trade: InterfaceTrade<Currency, Currency, TradeType> }) {
  const [flip, setFlip] = useState(true)
  const { inputAmount, outputAmount, executionPrice } = trade
  const fiatValueInput = useUSDCPrice(inputAmount.currency)
  const fiatValueOutput = useUSDCPrice(outputAmount.currency)

  const ratio = useMemo(() => {
    const [a, b] = flip ? [outputAmount, inputAmount] : [inputAmount, outputAmount]
    const priceString = (!flip ? executionPrice : executionPrice?.invert())?.toSignificant(6)

    const ratio = `1 ${a.currency.symbol} = ${priceString}} ${b.currency.symbol}`
    const usdc = !flip
      ? fiatValueInput
        ? ` ($${fiatValueInput.toSignificant(2)})`
        : null
      : fiatValueOutput
      ? ` ($${fiatValueOutput.toSignificant(2)})`
      : null

    return (
      <Row gap={0.25} style={{ userSelect: 'text' }}>
        {ratio}
        {usdc && <ThemedText.Caption color="secondary">{usdc}</ThemedText.Caption>}
      </Row>
    )
  }, [executionPrice, fiatValueInput, fiatValueOutput, flip, inputAmount, outputAmount])

  return (
    <>
      <RoutingTooltip />
      <TextButton color="primary" onClick={() => setFlip(!flip)}>
        {ratio}
      </TextButton>
    </>
  )
}
