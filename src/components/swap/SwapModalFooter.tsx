import { Percent, TradeType } from '@kinetix/sdk-core'
import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent } from 'analytics'
import Column from 'components/Column'
import { MouseoverTooltip } from 'components/Tooltip'
import { SwapResult } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { ReactNode } from 'react'
import { AlertTriangle } from 'react-feather'
import { InterfaceTrade, RouterPreference } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { useRouterPreference, useUserSlippageTolerance } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme'
import { formatSwapButtonClickEventProperties } from 'utils/loggingFormatters'

import { ButtonError, SmallButtonPrimary } from '../Button'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import { SwapCallbackError, SwapShowAcceptChanges } from './styled'
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
  swapResult,
  onConfirm,
  swapErrorMessage,
  disabledConfirm,
  fiatValueInput,
  fiatValueOutput,
  showAcceptChanges,
  onAcceptChanges,
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
}) {
  const transactionDeadlineSecondsSinceEpoch = useTransactionDeadline()?.toNumber() // in seconds since epoch
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [routerPreference] = useRouterPreference()
  const routes = undefined
  const theme = useTheme()
  const { chainId } = useWeb3React()

  return (
    <>
      <DetailsContainer gap="md">
        {isClassicTrade(trade) && (
          <ThemedText.BodySmall>
            {/* <Row align="flex-start" justify="space-between" gap="sm">
              <MouseoverTooltip text={<Trans>The impact your trade has on the market price of this pool.</Trans>}>
                <Label cursor="help">
                  <Trans>Price impact</Trans>
                </Label>
              </MouseoverTooltip>
              <DetailRowValue color={getPriceImpactWarning(trade.priceImpact)}>
                {trade.priceImpact ? formatPriceImpact(trade.priceImpact) : '-'}
              </DetailRowValue>
            </Row> */}
          </ThemedText.BodySmall>
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
                ? `${trade.minimumAmountOut(allowedSlippage).toSignificant(6)} ${trade.outputAmount.currency.symbol}`
                : ``}
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
              swapResult,
              allowedSlippage,
              transactionDeadlineSecondsSinceEpoch,
              isAutoSlippage,
              isAutoRouterApi: routerPreference === RouterPreference.API,
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
