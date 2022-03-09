import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { IconButton } from 'lib/components/Button'
import { useSwapTradeType } from 'lib/hooks/swap'
import { getSlippageWarning } from 'lib/hooks/useAllowedSlippage'
import useScrollbar from 'lib/hooks/useScrollbar'
import { AlertTriangle, BarChart, Expando, Info } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import formatLocaleNumber from 'lib/utils/formatLocaleNumber'
import { useMemo, useState } from 'react'
import { formatCurrencyAmount, formatPrice } from 'utils/formatCurrencyAmount'
import { computeRealizedPriceImpact, getPriceImpactWarning } from 'utils/prices'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import ActionButton, { Action } from '../../ActionButton'
import Column from '../../Column'
import { Header } from '../../Dialog'
import Row from '../../Row'
import Rule from '../../Rule'
import Details from './Details'
import Summary from './Summary'

export default Summary

const SummaryColumn = styled(Column)``
const ExpandoColumn = styled(Column)``
const DetailsColumn = styled(Column)``
const Estimate = styled(ThemedText.Caption)``
const Body = styled(Column)<{ open: boolean }>`
  height: calc(100% - 2.5em);

  ${SummaryColumn} {
    flex-grow: ${({ open }) => (open ? 0 : 1)};
    transition: flex-grow 0.25s;
  }

  ${ExpandoColumn} {
    flex-grow: ${({ open }) => (open ? 1 : 0)};
    transition: flex-grow 0.25s;

    ${DetailsColumn} {
      flex-basis: ${({ open }) => (open ? 7.5 : 0)}em;
      overflow-y: hidden;
      position: relative;
      transition: flex-basis 0.25s;

      ${Column} {
        height: 7.5em;
        grid-template-rows: repeat(auto-fill, 1em);
        padding: ${({ open }) => (open ? '0.5em 0' : 0)};
        transition: padding 0.25s;

        :after {
          background: linear-gradient(#ffffff00, ${({ theme }) => theme.dialog});
          bottom: 0;
          content: '';
          height: 0.75em;
          pointer-events: none;
          position: absolute;
          width: calc(100% - 1em);
        }
      }
    }

    ${Estimate} {
      max-height: ${({ open }) => (open ? 0 : 56 / 12)}em; // 2 * line-height + padding
      min-height: 0;
      overflow-y: hidden;
      padding: ${({ open }) => (open ? 0 : '1em 0')};
      transition: ${({ open }) =>
        open
          ? 'max-height 0.1s ease-out, padding 0.25s ease-out'
          : 'flex-grow 0.25s ease-out, max-height 0.1s ease-in, padding 0.25s ease-out'};
    }
  }
`

interface SummaryDialogProps {
  trade: Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  onConfirm: () => void
}

export function SummaryDialog({ trade, allowedSlippage, onConfirm }: SummaryDialogProps) {
  const { inputAmount, outputAmount, executionPrice } = trade
  const inputCurrency = inputAmount.currency
  const outputCurrency = outputAmount.currency
  const priceImpact = useMemo(() => computeRealizedPriceImpact(trade), [trade])
  const tradeType = useSwapTradeType()
  const { i18n } = useLingui()

  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<HTMLDivElement | null>(null)
  const scrollbar = useScrollbar(details)

  const warning = useMemo(() => {
    return getPriceImpactWarning(priceImpact) || getSlippageWarning(allowedSlippage)
  }, [allowedSlippage, priceImpact])

  const [ackPriceImpact, setAckPriceImpact] = useState(false)

  const [confirmedTrade, setConfirmedTrade] = useState(trade)
  const doesTradeDiffer = useMemo(
    () => Boolean(trade && confirmedTrade && tradeMeaningfullyDiffers(trade, confirmedTrade)),
    [confirmedTrade, trade]
  )

  const action = useMemo((): Action | undefined => {
    if (doesTradeDiffer) {
      return {
        message: <Trans>Price updated</Trans>,
        icon: BarChart,
        onClick: () => setConfirmedTrade(trade),
        children: <Trans>Accept</Trans>,
      }
    } else if (getPriceImpactWarning(priceImpact) === 'error' && !ackPriceImpact) {
      return {
        message: <Trans>High price impact</Trans>,
        onClick: () => setAckPriceImpact(true),
        children: <Trans>Acknowledge</Trans>,
      }
    }
    return
  }, [ackPriceImpact, doesTradeDiffer, priceImpact, trade])

  if (!(inputAmount && outputAmount && inputCurrency && outputCurrency)) {
    return null
  }

  return (
    <>
      <Header title={<Trans>Swap summary</Trans>} ruled />
      <Body flex align="stretch" gap={0.75} padded open={open}>
        <SummaryColumn gap={0.75} flex justify="center">
          <Summary input={inputAmount} output={outputAmount} showUSDC />
          <Row>
            <ThemedText.Caption userSelect>
              {formatLocaleNumber({ number: 1, sigFigs: 1, locale: i18n.locale })} {inputCurrency.symbol} ={' '}
              {formatPrice(executionPrice, 6, i18n.locale)} {outputCurrency.symbol}
            </ThemedText.Caption>
          </Row>
        </SummaryColumn>
        <Rule />
        <Row>
          <Row gap={0.5}>
            {warning ? <AlertTriangle color={warning} /> : <Info color="secondary" />}
            <ThemedText.Subhead2 color="secondary">
              <Trans>Swap details</Trans>
            </ThemedText.Subhead2>
          </Row>
          <IconButton color="secondary" onClick={() => setOpen(!open)} icon={Expando} iconProps={{ open }} />
        </Row>
        <ExpandoColumn flex align="stretch">
          <Rule />
          <DetailsColumn>
            <Column gap={0.5} ref={setDetails} css={scrollbar}>
              <Details trade={trade} allowedSlippage={allowedSlippage} />
            </Column>
          </DetailsColumn>
          <Estimate color="secondary">
            <Trans>Output is estimated.</Trans>{' '}
            {tradeType === TradeType.EXACT_INPUT && (
              <Trans>
                You will receive at least{' '}
                {formatCurrencyAmount(trade.minimumAmountOut(allowedSlippage), 6, i18n.locale)} {outputCurrency.symbol}{' '}
                or the transaction will revert.
              </Trans>
            )}
            {tradeType === TradeType.EXACT_OUTPUT && (
              <Trans>
                You will send at most {formatCurrencyAmount(trade.maximumAmountIn(allowedSlippage), 6, i18n.locale)}{' '}
                {inputCurrency.symbol} or the transaction will revert.
              </Trans>
            )}
          </Estimate>
          <ActionButton onClick={onConfirm} action={action}>
            <Trans>Confirm swap</Trans>
          </ActionButton>
        </ExpandoColumn>
      </Body>
    </>
  )
}
