import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import useUSDCPrice from 'hooks/useUSDCPrice'
import Tooltip from 'lib/components/Tooltip'
import { WrapType } from 'lib/hooks/swap/useWrapCallback'
import { AlertTriangle, Icon, Info, Spinner } from 'lib/icons'
import { ThemedText } from 'lib/theme'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { TextButton } from '../../Button'
import Row from '../../Row'
import RoutingDiagram from '../RoutingDiagram'

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

export function WrapCurrency({ loading, wrapType }: { loading: boolean; wrapType: WrapType.UNWRAP | WrapType.WRAP }) {
  const WrapText = useCallback(() => {
    if (wrapType === WrapType.WRAP) {
      return loading ? <Trans>Wrapping native currency.</Trans> : <Trans>Wrap native currency.</Trans>
    }
    return loading ? <Trans>Unwrapping native currency.</Trans> : <Trans>Unwrap native currency.</Trans>
  }, [loading, wrapType])

  return <Caption icon={Info} caption={<WrapText />} />
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
      <ThemedText.Caption userSelect>
        <Row gap={0.25}>
          {ratio}
          {usdc && <ThemedText.Caption color="secondary">{usdc}</ThemedText.Caption>}
        </Row>
      </ThemedText.Caption>
    )
  }, [executionPrice, fiatValueInput, fiatValueOutput, flip, inputAmount, outputAmount])

  return (
    <>
      <Tooltip placement="bottom" icon={Info}>
        <RoutingDiagram trade={trade} />
      </Tooltip>
      <TextButton color="primary" onClick={() => setFlip(!flip)}>
        {ratio}
      </TextButton>
    </>
  )
}
