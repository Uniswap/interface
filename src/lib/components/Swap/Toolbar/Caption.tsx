import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import Column from 'lib/components/Column'
import Rule from 'lib/components/Rule'
import Tooltip from 'lib/components/Tooltip'
import { loadingCss } from 'lib/css/loading'
import { PriceImpact } from 'lib/hooks/useUSDCPriceImpact'
import { AlertTriangle, Icon, Info, InlineSpinner } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { ReactNode, useCallback } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import Price from '../Price'
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

export function Connecting() {
  return (
    <Caption
      icon={InlineSpinner}
      caption={
        <Loading>
          <Trans>Connecting…</Trans>
        </Loading>
      }
    />
  )
}

export function ConnectWallet() {
  return <Caption caption={<Trans>Connect wallet to swap</Trans>} />
}

export function UnsupportedNetwork() {
  return <Caption caption={<Trans>Unsupported network - switch to another to trade</Trans>} />
}

export function InsufficientBalance({ currency }: { currency: Currency }) {
  return <Caption caption={<Trans>Insufficient {currency?.symbol} balance</Trans>} />
}

export function InsufficientLiquidity() {
  return <Caption caption={<Trans>Insufficient liquidity in the pool for your trade</Trans>} />
}

export function Error() {
  return <Caption caption={<Trans>Error fetching trade</Trans>} />
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

export function WrapCurrency({ inputCurrency, outputCurrency }: { inputCurrency: Currency; outputCurrency: Currency }) {
  const Text = useCallback(
    () => (
      <Trans>
        Convert {inputCurrency.symbol} to {outputCurrency.symbol}
      </Trans>
    ),
    [inputCurrency.symbol, outputCurrency.symbol]
  )

  return <Caption icon={Info} caption={<Text />} />
}

export function Trade({
  trade,
  outputUSDC,
  impact,
}: {
  trade: InterfaceTrade<Currency, Currency, TradeType>
  outputUSDC?: CurrencyAmount<Currency>
  impact?: PriceImpact
}) {
  return (
    <>
      <Tooltip placement="bottom" icon={impact?.warning ? AlertTriangle : Info}>
        <Column gap={0.75}>
          {impact?.warning && (
            <>
              <ThemedText.Caption>
                The output amount is estimated at {impact.toString()} less than the input amount due to high price
                impact
              </ThemedText.Caption>
              <Rule />
            </>
          )}
          <RoutingDiagram trade={trade} />
        </Column>
      </Tooltip>
      <Price trade={trade} outputUSDC={outputUSDC} />
    </>
  )
}
