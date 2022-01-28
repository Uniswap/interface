import { Trans } from '@lingui/macro'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { useAtomValue } from 'jotai/utils'
import { IconButton } from 'lib/components/Button'
import useScrollbar from 'lib/hooks/useScrollbar'
import { Expando, Info } from 'lib/icons'
import { Field, independentFieldAtom } from 'lib/state/swap'
import styled, { ThemedText } from 'lib/theme'
import { useMemo, useState } from 'react'
import { tradeMeaningfullyDiffers } from 'utils/tradeMeaningFullyDiffer'

import ActionButton from '../../ActionButton'
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
      flex-basis: ${({ open }) => (open ? 7 : 0)}em;
      overflow-y: hidden;
      position: relative;
      transition: flex-basis 0.25s;

      ${Column} {
        height: 100%;
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
      overflow-y: hidden;
      padding: ${({ open }) => (open ? 0 : '1em 0')};
      transition: ${({ open }) =>
        open
          ? 'max-height 0.1s ease-out, padding 0.25s ease-out'
          : 'flex-grow 0.25s ease-out, max-height 0.1s ease-in, padding 0.25s ease-out'};
    }
  }
`

const priceUpdate = { message: <Trans>Price updated</Trans>, action: <Trans>Accept</Trans> }

interface SummaryDialogProps {
  trade: Trade<Currency, Currency, TradeType>
  allowedSlippage: Percent
  onConfirm: () => void
}

export function SummaryDialog({ trade, allowedSlippage, onConfirm }: SummaryDialogProps) {
  const { inputAmount, outputAmount } = trade
  const inputCurrency = inputAmount.currency
  const outputCurrency = outputAmount.currency
  const price = trade.executionPrice

  const independentField = useAtomValue(independentFieldAtom)

  const [confirmedTrade, setConfirmedTrade] = useState(trade)
  const doesTradeDiffer = useMemo(
    () => Boolean(trade && confirmedTrade && tradeMeaningfullyDiffers(trade, confirmedTrade)),
    [confirmedTrade, trade]
  )
  const [open, setOpen] = useState(false)

  const [details, setDetails] = useState<HTMLDivElement | null>(null)

  const scrollbar = useScrollbar(details)

  if (!(inputAmount && outputAmount && inputCurrency && outputCurrency)) {
    return null
  }

  return (
    <>
      <Header title={<Trans>Swap summary</Trans>} ruled />
      <Body flex align="stretch" gap={0.75} padded open={open}>
        <SummaryColumn gap={0.75} flex justify="center">
          <Summary input={inputAmount} output={outputAmount} usdc={true} />
          <ThemedText.Caption>
            1 {inputCurrency.symbol} = {price?.toSignificant(6)} {outputCurrency.symbol}
          </ThemedText.Caption>
        </SummaryColumn>
        <Rule />
        <Row>
          <Row gap={0.5}>
            <Info color="secondary" />
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
            <Trans>Output is estimated.</Trans>
            {independentField === Field.INPUT && (
              <Trans>
                You will send at most {trade.maximumAmountIn(allowedSlippage).toSignificant(6)} {inputCurrency.symbol}{' '}
                or the transaction will revert.
              </Trans>
            )}
            {independentField === Field.OUTPUT && (
              <Trans>
                You will receive at least {trade.minimumAmountOut(allowedSlippage).toSignificant(6)}{' '}
                {outputCurrency.symbol} or the transaction will revert.
              </Trans>
            )}
          </Estimate>
          <ActionButton
            onClick={onConfirm}
            onUpdate={() => setConfirmedTrade(trade)}
            update={doesTradeDiffer ? priceUpdate : undefined}
          >
            <Trans>Confirm swap</Trans>
          </ActionButton>
        </ExpandoColumn>
      </Body>
    </>
  )
}
