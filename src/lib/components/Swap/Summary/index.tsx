import { Trans } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { Trade } from '@uniswap/router-sdk'
import { Currency, TradeType } from '@uniswap/sdk-core'
import ActionButton, { Action } from 'lib/components/ActionButton'
import { IconButton } from 'lib/components/Button'
import Column from 'lib/components/Column'
import { Header } from 'lib/components/Dialog'
import Row from 'lib/components/Row'
import Rule from 'lib/components/Rule'
import { useSwapTradeType } from 'lib/hooks/swap'
import useScrollbar from 'lib/hooks/useScrollbar'
import { Slippage } from 'lib/hooks/useSlippage'
import useUSDCPriceImpact from 'lib/hooks/useUSDCPriceImpact'
import { AlertTriangle, BarChart, Expando, Info } from 'lib/icons'
import styled, { Color, ThemedText } from 'lib/theme'
import { useMemo, useState } from 'react'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import Price from '../Price'
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
      flex-basis: ${({ open }) => (open ? 6.75 : 0)}em;
      overflow-y: hidden;
      position: relative;
      transition: flex-basis 0.25s;

      ${Column} {
        height: 6.75em;
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

function Subhead({ priceImpact, slippage }: { priceImpact: { warning?: Color }; slippage: { warning?: Color } }) {
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

interface SummaryDialogProps {
  trade: Trade<Currency, Currency, TradeType>
  slippage: Slippage
  onConfirm: () => void
}

export function SummaryDialog({ trade, slippage, onConfirm }: SummaryDialogProps) {
  const { inputAmount, outputAmount } = trade
  const inputCurrency = inputAmount.currency
  const outputCurrency = outputAmount.currency
  const usdcPriceImpact = useUSDCPriceImpact(inputAmount, outputAmount)
  const tradeType = useSwapTradeType()
  const { i18n } = useLingui()

  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState<HTMLDivElement | null>(null)
  const scrollbar = useScrollbar(details)

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
    } else if (usdcPriceImpact.warning === 'error' && !ackPriceImpact) {
      return {
        message: <Trans>High price impact</Trans>,
        onClick: () => setAckPriceImpact(true),
        children: <Trans>Acknowledge</Trans>,
      }
    }
    return
  }, [ackPriceImpact, doesTradeDiffer, trade, usdcPriceImpact.warning])

  if (!(inputAmount && outputAmount && inputCurrency && outputCurrency)) {
    return null
  }

  return (
    <>
      <Header title={<Trans>Swap summary</Trans>} ruled />
      <Body flex align="stretch" gap={0.75} padded open={open}>
        <SummaryColumn gap={0.75} flex justify="center">
          <Summary input={inputAmount} output={outputAmount} usdcPriceImpact={usdcPriceImpact} />
          <Price trade={trade} />
        </SummaryColumn>
        <Rule />
        <Row>
          <Subhead priceImpact={usdcPriceImpact} slippage={slippage} />
          <IconButton color="secondary" onClick={() => setOpen(!open)} icon={Expando} iconProps={{ open }} />
        </Row>
        <ExpandoColumn flex align="stretch">
          <Rule />
          <DetailsColumn>
            <Column gap={0.5} ref={setDetails} css={scrollbar}>
              <Details trade={trade} slippage={slippage} usdcPriceImpact={usdcPriceImpact} />
            </Column>
          </DetailsColumn>
          <Estimate color="secondary">
            <Trans>Output is estimated.</Trans>{' '}
            {tradeType === TradeType.EXACT_INPUT && (
              <Trans>
                You will receive at least{' '}
                {formatCurrencyAmount(trade.minimumAmountOut(slippage.allowed), 6, i18n.locale)} {outputCurrency.symbol}{' '}
                or the transaction will revert.
              </Trans>
            )}
            {tradeType === TradeType.EXACT_OUTPUT && (
              <Trans>
                You will send at most {formatCurrencyAmount(trade.maximumAmountIn(slippage.allowed), 6, i18n.locale)}{' '}
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
