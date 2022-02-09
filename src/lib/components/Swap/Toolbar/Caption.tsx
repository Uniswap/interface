import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'
import { AlertTriangle, Icon, Info, Spinner } from 'lib/icons'
import { ThemedText } from 'lib/theme'
import { ReactNode, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { TextButton } from '../../Button'
import Row from '../../Row'
import RoutingTooltip from './RoutingTooltip'

interface CaptionProps {
  icon?: Icon
  caption: ReactNode
}

function Caption({ icon: Icon = AlertTriangle, caption }: CaptionProps) {
  return (
    <>
      <Icon color="secondary" />
      {caption}
    </>
  )
}

export function ConnectWallet() {
  return <Caption caption={<Trans>Connect wallet to swap</Trans>} />
}
export function UnsupportedNetwork() {
  return <Caption caption={<Trans>Unsupported network - switch to another to trade.</Trans>} />
}
export function InsufficientBalance({ currency }: { currency: Currency }) {
  return <Caption caption={<Trans>Insufficient {currency?.symbol} balance</Trans>} />
}
export function InsufficientLiquidity() {
  return <Caption caption={<Trans>Insufficient liquidity in the pool for your trade</Trans>} />
}
export function Empty() {
  return <Caption icon={Info} caption={<Trans>Enter an amount</Trans>} />
}
export function LoadingTrade() {
  return <Caption icon={Spinner} caption={<Trans>Fetching best price…</Trans>} />
}

export function Trade({ trade }: { trade: InterfaceTrade<Currency, Currency, TradeType> }) {
  const [flip, setFlip] = useState(true)
  const { inputAmount, outputAmount, executionPrice } = trade
  const fiatValueInput = useUSDCPrice(inputAmount.currency)
  const fiatValueOutput = useUSDCPrice(outputAmount.currency)

  const ratio = useMemo(() => {
    const [a, b] = flip ? [outputAmount, inputAmount] : [inputAmount, outputAmount]
    const priceString = (!flip ? executionPrice : executionPrice?.invert())?.toSignificant(6)

    const ratio = `1 ${a.currency.symbol} = ${priceString} ${b.currency.symbol}`
    const usdc = !flip
      ? fiatValueInput
        ? ` ($${fiatValueInput.toSignificant(6)})`
        : null
      : fiatValueOutput
      ? ` ($${fiatValueOutput.toSignificant(6)})`
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
