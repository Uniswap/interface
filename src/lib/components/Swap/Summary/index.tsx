import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import ActionButton, { Action } from 'lib/components/ActionButton'
import Column from 'lib/components/Column'
import { Header } from 'lib/components/Dialog'
import Expando from 'lib/components/Expando'
import Row from 'lib/components/Row'
import { Slippage } from 'lib/hooks/useSlippage'
import { PriceImpact } from 'lib/hooks/useUSDCPriceImpact'
import { AlertTriangle, BarChart, Info } from 'lib/icons'
import styled, { Color, ThemedText } from 'lib/theme'
import { useCallback, useMemo, useState } from 'react'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import Price from '../Price'
import Details from './Details'
import Summary from './Summary'

export default Summary

const Content = styled(Column)``
const Heading = styled(Column)``
const Footing = styled(Column)``
const Body = styled(Column)<{ open: boolean }>`
  height: calc(100% - 2.5em);

  ${Content}, ${Heading} {
    flex-grow: 1;
    transition: flex-grow 0.25s;
  }

  ${Footing} {
    margin-bottom: ${({ open }) => (open ? '-0.75em' : undefined)};
    max-height: ${({ open }) => (open ? 0 : '3em')};
    opacity: ${({ open }) => (open ? 0 : 1)};
    transition: max-height 0.25s, margin-bottom 0.25s, opacity 0.15s 0.1s;
    visibility: ${({ open }) => (open ? 'hidden' : undefined)};
  }
`

function Subhead({ priceImpact, slippage }: { priceImpact: { warning?: Color }; slippage: Slippage }) {
  return (
    <Row gap={0.5}>
      {priceImpact.warning || slippage.warning ? (
        <AlertTriangle color={priceImpact.warning || slippage.warning} />
      ) : (
        <Info color="secondary" />
      )}
      <ThemedText.Subhead2 color={priceImpact.warning || slippage.warning || 'secondary'}>
        {priceImpact.warning ? (
          <Trans>High price impact</Trans>
        ) : slippage.warning ? (
          <Trans>High slippage</Trans>
        ) : (
          <Trans>Swap details</Trans>
        )}
      </ThemedText.Subhead2>
    </Row>
  )
}

function Estimate({ trade, slippage }: { trade: Trade<Currency, Currency, TradeType>; slippage: Slippage }) {
  const { i18n } = useLingui()
  const text = useMemo(() => {
    switch (trade.tradeType) {
      case TradeType.EXACT_INPUT:
        return (
          <Trans>
            Output is estimated. You will receive at least{' '}
            {formatCurrencyAmount(trade.minimumAmountOut(slippage.allowed), 6, i18n.locale)}{' '}
            {trade.outputAmount.currency.symbol} or the transaction will revert.
          </Trans>
        )
      case TradeType.EXACT_OUTPUT:
        return (
          <Trans>
            Output is estimated. You will send at most{' '}
            {formatCurrencyAmount(trade.maximumAmountIn(slippage.allowed), 6, i18n.locale)}{' '}
            {trade.inputAmount.currency.symbol} or the transaction will revert.
          </Trans>
        )
    }
  }, [i18n.locale, slippage.allowed, trade])
  return <ThemedText.Caption color="secondary">{text}</ThemedText.Caption>
}

function ConfirmButton({
  trade,
  highPriceImpact,
  onConfirm,
}: {
  trade: Trade<Currency, Currency, TradeType>
  highPriceImpact: boolean
  onConfirm: () => void
}) {
  const [ackPriceImpact, setAckPriceImpact] = useState(false)
  const [ackTrade, setAckTrade] = useState(trade)
  const doesTradeDiffer = useMemo(
    () => Boolean(trade && ackTrade && tradeMeaningfullyDiffers(trade, ackTrade)),
    [ackTrade, trade]
  )
  const action = useMemo((): Action | undefined => {
    if (doesTradeDiffer) {
      return {
        message: <Trans>Price updated</Trans>,
        icon: BarChart,
        onClick: () => setAckTrade(trade),
        children: <Trans>Accept</Trans>,
      }
    } else if (highPriceImpact && !ackPriceImpact) {
      return {
        message: <Trans>High price impact</Trans>,
        onClick: () => setAckPriceImpact(true),
        children: <Trans>Acknowledge</Trans>,
      }
    }
    return
  }, [ackPriceImpact, doesTradeDiffer, highPriceImpact, trade])

  return (
    <ActionButton onClick={onConfirm} action={action}>
      <Trans>Confirm swap</Trans>
    </ActionButton>
  )
}

interface SummaryDialogProps {
  trade: Trade<Currency, Currency, TradeType>
  slippage: Slippage
  inputUSDC?: CurrencyAmount<Currency>
  outputUSDC?: CurrencyAmount<Currency>
  impact: PriceImpact
  onConfirm: () => void
}

export function SummaryDialog({ trade, slippage, inputUSDC, outputUSDC, impact, onConfirm }: SummaryDialogProps) {
  const { inputAmount, outputAmount } = trade

  const [open, setOpen] = useState(false)
  const onExpand = useCallback(() => setOpen((open) => !open), [])

  return (
    <>
      <Header title={<Trans>Swap summary</Trans>} ruled />
      <Body flex align="stretch" padded gap={0.75} open={open}>
        <Heading gap={0.75} flex justify="center">
          <Summary
            input={inputAmount}
            output={outputAmount}
            inputUSDC={inputUSDC}
            outputUSDC={outputUSDC}
            priceImpact={impact}
          />
          <Price trade={trade} />
        </Heading>
        <Column gap={open ? 0 : 0.75} style={{ transition: 'gap 0.25s' }}>
          <Expando
            title={<Subhead priceImpact={impact} slippage={slippage} />}
            open={open}
            onExpand={onExpand}
            height={7.25}
          >
            <Details trade={trade} slippage={slippage} priceImpact={impact} />
          </Expando>
          <Footing>
            <Estimate trade={trade} slippage={slippage} />
          </Footing>
          <ConfirmButton trade={trade} highPriceImpact={impact.warning === 'error'} onConfirm={onConfirm} />
        </Column>
      </Body>
    </>
  )
}
