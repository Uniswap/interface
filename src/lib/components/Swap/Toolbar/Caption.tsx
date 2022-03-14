import { Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import Column from 'lib/components/Column'
import Rule from 'lib/components/Rule'
import Tooltip from 'lib/components/Tooltip'
import { loadingCss } from 'lib/css/loading'
import { WrapType } from 'lib/hooks/swap/useWrapCallback'
import useUSDCPriceImpact from 'lib/hooks/useUSDCPriceImpact'
import { AlertTriangle, Icon, Info, InlineSpinner } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { ReactNode, useCallback, useMemo, useState } from 'react'
import { InterfaceTrade } from 'state/routing/types'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import { TextButton } from '../../Button'
import Row from '../../Row'
import RoutingDiagram from '../RoutingDiagram'

const Loading = styled.span`
  color: ${({ theme }) => theme.secondary};
  ${loadingCss};
`

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
  return (
    <Caption
      icon={InlineSpinner}
      caption={
        <Loading>
          <Trans>Fetching best price…</Trans>
        </Loading>
      }
    />
  )
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
  const { inputAmount: input, outputAmount: output, executionPrice } = trade
  const { inputUSDC, outputUSDC, priceImpact, warning: priceImpactWarning } = useUSDCPriceImpact(input, output)

  const ratio = useMemo(() => {
    const [a, b] = flip ? [output, input] : [input, output]
    const priceString = (!flip ? executionPrice : executionPrice?.invert())?.toSignificant(6)

    const ratio = `1 ${a.currency.symbol} = ${priceString} ${b.currency.symbol}`
    const usdc = !flip
      ? inputUSDC
        ? ` ($${formatCurrencyAmount(inputUSDC, 6, 'en', 2)})`
        : null
      : outputUSDC
      ? ` ($${formatCurrencyAmount(outputUSDC, 6, 'en', 2)})`
      : null

    return (
      <ThemedText.Caption userSelect>
        <Row gap={0.25}>
          {ratio}
          {usdc && <ThemedText.Caption color="secondary">{usdc}</ThemedText.Caption>}
        </Row>
      </ThemedText.Caption>
    )
  }, [flip, output, input, executionPrice, inputUSDC, outputUSDC])

  return (
    <>
      <Tooltip placement="bottom" icon={priceImpactWarning ? AlertTriangle : Info}>
        <Column gap={0.75}>
          {priceImpactWarning && (
            <>
              <ThemedText.Caption>
                The output amount is estimated at {priceImpact} less than the input amount due to high price impact
              </ThemedText.Caption>
              <Rule />
            </>
          )}
          <RoutingDiagram trade={trade} />
        </Column>
      </Tooltip>
      <TextButton color="primary" onClick={() => setFlip(!flip)}>
        {ratio}
      </TextButton>
    </>
  )
}
