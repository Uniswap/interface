import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { formatPriceImpact } from '@uniswap/conedison/format'
import { Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import { MouseoverTooltip } from 'components/Tooltip'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { RouterPreference } from 'state/routing/slice'
import { InterfaceTrade } from 'state/routing/types'
import { useRouterPreference, useUserSlippageTolerance } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { formatTransactionAmount, priceToPreciseFloat } from 'utils/formatNumbers'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'
import { formatSwapButtonClickEventProperties } from 'utils/loggingFormatters'
import { getPriceImpactWarning } from 'utils/prices'

import { ButtonError, SmallButtonPrimary } from '../Button'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import { SwapCallbackError, SwapShowAcceptChanges } from './styleds'
import { Label } from './SwapModalHeaderAmount'

const DetailsContainer = styled(Column)`
  padding: 0 8px;
`

const StyledAlertTriangle = styled(AlertTriangle)`
  margin-right: 8px;
  min-width: 24px;
`

const ConfirmButton = styled(ButtonError)`
  height: 56px;
  margin-top: 10px;
`

const DetailRowValue = styled(ThemedText.BodySmall)`
  text-align: right;
  overflow-wrap: break-word;
`

export default function SwapModalFooter({
  trade,
  allowedSlippage,
  hash,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  swapQuoteReceivedDate,
  fiatValueInput,
  fiatValueOutput,
  showAcceptChanges,
  onAcceptChanges,
}: {
  trade: InterfaceTrade
  hash?: string
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage?: ReactNode
  disabledConfirm: boolean
  swapQuoteReceivedDate?: Date
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  showAcceptChanges: boolean
  onAcceptChanges: () => void
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [routerPreference] = useRouterPreference()
  const routes = getRoutingDiagramEntries(trade)
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)

  const label = `${trade.executionPrice.baseCurrency?.symbol} `
  const labelInverted = `${trade.executionPrice.quoteCurrency?.symbol}`
  const formattedPrice = formatTransactionAmount(priceToPreciseFloat(trade.executionPrice))

  return (
    <>
      <DetailsContainer gap="md">
        <ThemedText.BodySmall>
          <Row align="flex-start" justify="space-between" gap="sm">
            <Label>
              <Trans>Exchange rate</Trans>
            </Label>
            <DetailRowValue>{`1 ${labelInverted} = ${formattedPrice ?? '-'} ${label}`}</DetailRowValue>
          </Row>
        </ThemedText.BodySmall>
        <ThemedText.BodySmall>
          <Row align="flex-start" justify="space-between" gap="sm">
            <MouseoverTooltip
              text={
                <Trans>
                  The fee paid to miners who process your transaction. This must be paid in ${nativeCurrency.symbol}.
                </Trans>
              }
            >
              <Label cursor="help">
                <Trans>Network fee</Trans>
              </Label>
            </MouseoverTooltip>
            <DetailRowValue>{trade.gasUseEstimateUSD ? `~$${trade.gasUseEstimateUSD}` : '-'}</DetailRowValue>
          </Row>
        </ThemedText.BodySmall>
        <ThemedText.BodySmall>
          <Row align="flex-start" justify="space-between" gap="sm">
            <MouseoverTooltip text={<Trans>The impact your trade has on the market price of this pool.</Trans>}>
              <Label cursor="help">
                <Trans>Price impact</Trans>
              </Label>
            </MouseoverTooltip>
            <DetailRowValue color={getPriceImpactWarning(trade.priceImpact)}>
              {trade.priceImpact ? formatPriceImpact(trade.priceImpact) : '-'}
            </DetailRowValue>
          </Row>
        </ThemedText.BodySmall>
        <ThemedText.BodySmall>
          <Row align="flex-start" justify="space-between" gap="sm">
            <MouseoverTooltip
              text={
                trade.tradeType === TradeType.EXACT_INPUT ? (
                  <Trans>
                    The minimum amount you are guaranteed to receive. If the price slips any further, your transaction
                    will revert.
                  </Trans>
                ) : (
                  <Trans>
                    The maximum amount you are guaranteed to spend. If the price slips any further, your transaction
                    will revert.
                  </Trans>
                )
              }
            >
              <Label cursor="help">
                {trade.tradeType === TradeType.EXACT_INPUT ? (
                  <Trans>Minimum received</Trans>
                ) : (
                  <Trans>Maximum sent</Trans>
                )}
              </Label>
            </MouseoverTooltip>
            <DetailRowValue>
              {trade.tradeType === TradeType.EXACT_INPUT
                ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
                : `${trade.maximumAmountIn(allowedSlippage).toSignificant(6)} ${trade.inputAmount.currency.symbol}`}
            </DetailRowValue>
          </Row>
        </ThemedText.BodySmall>
      </DetailsContainer>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges data-testid="show-accept-changes">
          <RowBetween>
            <RowFixed>
              <StyledAlertTriangle size={20} />
              <ThemedText.DeprecatedMain color={theme.accentAction}>
                <Trans>Price updated</Trans>
              </ThemedText.DeprecatedMain>
            </RowFixed>
            <SmallButtonPrimary onClick={onAcceptChanges}>
              <Trans>Accept</Trans>
            </SmallButtonPrimary>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : (
        <AutoRow>
          <TraceEvent
            events={[BrowserEvent.onClick]}
            element={InterfaceElementName.CONFIRM_SWAP_BUTTON}
            name={SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED}
            properties={formatSwapButtonClickEventProperties({
              trade,
              hash,
              allowedSlippage,
              transactionDeadlineSecondsSinceEpoch,
              isAutoSlippage,
              isAutoRouterApi: routerPreference === RouterPreference.AUTO || routerPreference === RouterPreference.API,
              swapQuoteReceivedDate,
              routes,
              fiatValueInput: fiatValueInput.data,
              fiatValueOutput: fiatValueOutput.data,
            })}
          >
            <ConfirmButton
              data-testid="confirm-swap-button"
              onClick={onConfirm}
              disabled={disabledConfirm}
              $borderRadius="12px"
              id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
            >
              <ThemedText.HeadlineSmall color="accentTextLightPrimary">
                <Trans>Confirm swap</Trans>
              </ThemedText.HeadlineSmall>
            </ConfirmButton>
          </TraceEvent>

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      )}
    </>
  )
}
