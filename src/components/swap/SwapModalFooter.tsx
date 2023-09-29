import { Plural, t, Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Percent, TradeType } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import Column from 'components/Column'
import SpinningLoader from 'components/Loader/SpinningLoader'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { ZERO_PERCENT } from 'constants/misc'
import { SwapResult } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { ClassicTrade, InterfaceTrade, PreviewTrade, RouterPreference } from 'state/routing/types'
import { getTransactionCount, isClassicTrade, isPreviewTrade, isSubmittableTrade } from 'state/routing/utils'
import { useRouterPreference, useUserSlippageTolerance } from 'state/user/hooks'
import styled, { DefaultTheme, useTheme } from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { FormatterRule, NumberType, SIX_SIG_FIGS_NO_COMMAS, useFormatter } from 'utils/formatNumbers'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'
import { formatSwapButtonClickEventProperties } from 'utils/loggingFormatters'
import { getPriceImpactColor } from 'utils/prices'

import { ButtonError, SmallButtonPrimary } from '../Button'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import { GasBreakdownTooltip } from './GasBreakdownTooltip'
import { SwapCallbackError, SwapShowAcceptChanges } from './styled'
import { Label } from './SwapModalHeaderAmount'

const sixFigsFormatterRules: FormatterRule[] = [{ upperBound: Infinity, formatterOptions: SIX_SIG_FIGS_NO_COMMAS }]

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

const DetailRowValue = styled(ThemedText.BodySmall)<{ warningColor?: keyof DefaultTheme }>`
  text-align: right;
  overflow-wrap: break-word;
  ${({ warningColor, theme }) => warningColor && `color: ${theme[warningColor]};`};
`

export default function SwapModalFooter({
  trade,
  allowedSlippage,
  swapResult,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  fiatValueInput,
  fiatValueOutput,
  showAcceptChanges,
  onAcceptChanges,
  isLoading,
}: {
  trade: InterfaceTrade
  swapResult?: SwapResult
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage?: ReactNode
  disabledConfirm: boolean
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  showAcceptChanges: boolean
  onAcceptChanges: () => void
  isLoading: boolean
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [routerPreference] = useRouterPreference()
  const routes = isClassicTrade(trade) ? getRoutingDiagramEntries(trade) : undefined
  const theme = useTheme()
  const { chainId } = useWeb3React()
  const nativeCurrency = useNativeCurrency(chainId)
  const { formatCurrencyAmount, formatNumber, formatPriceImpact } = useFormatter()

  const label = `${trade.executionPrice.baseCurrency?.symbol} `
  const labelInverted = `${trade.executionPrice.quoteCurrency?.symbol}`
  const formattedPrice = formatNumber({
    input: trade.executionPrice ? parseFloat(trade.executionPrice.toFixed(9)) : undefined,
    type: NumberType.TokenTx,
  })
  const txCount = getTransactionCount(trade)

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
                <Plural value={txCount} one="Network fee" other="Network fees" />
              </Label>
            </MouseoverTooltip>
            <MouseoverTooltip
              placement="right"
              size={TooltipSize.Small}
              text={isSubmittableTrade(trade) ? <GasBreakdownTooltip trade={trade} /> : undefined}
            >
              <DetailRowValue>
                {isSubmittableTrade(trade)
                  ? formatNumber({
                      input: trade.totalGasUseEstimateUSD,
                      type: NumberType.FiatGasPrice,
                    })
                  : '-'}
              </DetailRowValue>
            </MouseoverTooltip>
          </Row>
        </ThemedText.BodySmall>
        {(isClassicTrade(trade) || isPreviewTrade(trade)) && (
          <>
            <TokenTaxLineItem trade={trade} type="input" />
            <TokenTaxLineItem trade={trade} type="output" />
            <ThemedText.BodySmall>
              <Row align="flex-start" justify="space-between" gap="sm">
                <MouseoverTooltip text={<Trans>The impact your trade has on the market price of this pool.</Trans>}>
                  <Label cursor="help">
                    <Trans>Price impact</Trans>
                  </Label>
                </MouseoverTooltip>
                <DetailRowValue
                  warningColor={isClassicTrade(trade) ? getPriceImpactColor(trade.priceImpact) : undefined}
                >
                  {isClassicTrade(trade) && trade.priceImpact ? formatPriceImpact(trade.priceImpact) : '-'}
                </DetailRowValue>
              </Row>
            </ThemedText.BodySmall>
          </>
        )}
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
                ? `${formatCurrencyAmount({
                    amount: trade.minimumAmountOut(allowedSlippage),
                    type: sixFigsFormatterRules,
                  })} ${trade.outputAmount.currency.symbol}`
                : `${formatCurrencyAmount({
                    amount: trade.maximumAmountIn(allowedSlippage),
                    type: sixFigsFormatterRules,
                  })} ${trade.inputAmount.currency.symbol}`}
            </DetailRowValue>
          </Row>
        </ThemedText.BodySmall>
      </DetailsContainer>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges data-testid="show-accept-changes">
          <RowBetween>
            <RowFixed>
              <StyledAlertTriangle size={20} />
              <ThemedText.DeprecatedMain color={theme.accent1}>
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
              swapResult,
              allowedSlippage,
              transactionDeadlineSecondsSinceEpoch,
              isAutoSlippage,
              isAutoRouterApi: routerPreference === RouterPreference.API,
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
              {isLoading ? (
                <ThemedText.HeadlineSmall color="neutral2">
                  <Row>
                    <SpinningLoader />
                    <Trans>Finalizing quote...</Trans>
                  </Row>
                </ThemedText.HeadlineSmall>
              ) : (
                <ThemedText.HeadlineSmall color="deprecated_accentTextLightPrimary">
                  <Trans>Confirm swap</Trans>
                </ThemedText.HeadlineSmall>
              )}
            </ConfirmButton>
          </TraceEvent>

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      )}
    </>
  )
}

function TokenTaxLineItem({ trade, type }: { trade: ClassicTrade | PreviewTrade; type: 'input' | 'output' }) {
  const { formatPriceImpact } = useFormatter()

  const [currency, percentage] =
    type === 'input' ? [trade.inputAmount.currency, trade.inputTax] : [trade.outputAmount.currency, trade.outputTax]

  if (percentage.equalTo(ZERO_PERCENT)) return null

  return (
    <ThemedText.BodySmall>
      <Row align="flex-start" justify="space-between" gap="sm">
        <MouseoverTooltip
          text={
            <>
              <Trans>
                Some tokens take a fee when they are bought or sold, which is set by the token issuer. Uniswap does not
                receive any of these fees.
              </Trans>{' '}
              <ExternalLink href="https://support.uniswap.org/hc/en-us/articles/18673568523789-What-is-a-token-fee-">
                Learn more
              </ExternalLink>
            </>
          }
        >
          <Label cursor="help">{t`${currency.symbol} fee`}</Label>
        </MouseoverTooltip>
        <DetailRowValue warningColor={getPriceImpactColor(percentage)}>{formatPriceImpact(percentage)}</DetailRowValue>
      </Row>
    </ThemedText.BodySmall>
  )
}
