import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Percent } from '@uniswap/sdk-core'
import { TraceEvent } from 'analytics'
import AnimatedDropdown from 'components/AnimatedDropdown'
import Column from 'components/Column'
import SpinningLoader from 'components/Loader/SpinningLoader'
import { SwapResult } from 'hooks/useSwapCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import ms from 'ms'
import { ReactNode, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { easings, useSpring } from 'react-spring'
import { InterfaceTrade, RouterPreference } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { useRouterPreference, useUserSlippageTolerance } from 'state/user/hooks'
import styled, { useTheme } from 'styled-components'
import { Separator, ThemedText } from 'theme/components'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'
import { formatSwapButtonClickEventProperties } from 'utils/loggingFormatters'

import { ReactComponent as ExpandoIconClosed } from '../../assets/svg/expando-icon-closed.svg'
import { ReactComponent as ExpandoIconOpened } from '../../assets/svg/expando-icon-opened.svg'
import { ButtonError, SmallButtonPrimary } from '../Button'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import { SwapCallbackError, SwapShowAcceptChanges } from './styled'
import { SwapLineItemProps, SwapLineItemType } from './SwapLineItem'
import SwapLineItem from './SwapLineItem'

const DetailsContainer = styled(Column)`
  padding-bottom: 8px;
`

const StyledAlertTriangle = styled(AlertTriangle)`
  margin-right: 8px;
  min-width: 24px;
`

const ConfirmButton = styled(ButtonError)`
  height: 56px;
`

const DropdownControllerWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-right: -6px;

  padding: 0 16px;
  min-width: fit-content;
  white-space: nowrap;
`

const DropdownButton = styled.button`
  padding: 0;
  margin-top: 16px;
  height: 28px;
  text-decoration: none;
  display: flex;
  background: none;
  border: none;
  align-items: center;
  cursor: pointer;
`

function DropdownController({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <DropdownButton onClick={onClick}>
      <Separator />
      <DropdownControllerWrapper>
        <ThemedText.BodySmall color="neutral2">
          {open ? <Trans>Show less</Trans> : <Trans>Show more</Trans>}
        </ThemedText.BodySmall>
        {open ? <ExpandoIconOpened /> : <ExpandoIconClosed />}
      </DropdownControllerWrapper>
      <Separator />
    </DropdownButton>
  )
}

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
  const [showMore, setShowMore] = useState(false)

  const lineItemProps = { trade, allowedSlippage, syncing: false }

  return (
    <>
      <DropdownController open={showMore} onClick={() => setShowMore(!showMore)} />
      <DetailsContainer gap="md">
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.EXCHANGE_RATE} />
        <ExpandableLineItems {...lineItemProps} open={showMore} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.OUTPUT_TOKEN_FEE_ON_TRANSFER} />
        <SwapLineItem {...lineItemProps} type={SwapLineItemType.NETWORK_COST} />
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

function AnimatedLineItem(props: SwapLineItemProps & { open: boolean; delay: number }) {
  const { open, delay } = props

  const animatedProps = useSpring({
    animatedOpacity: open ? 1 : 0,
    config: { duration: ms('300ms'), easing: easings.easeOutSine },
    delay,
  })

  return <SwapLineItem {...props} {...animatedProps} />
}

function ExpandableLineItems(props: { trade: InterfaceTrade; allowedSlippage: Percent; open: boolean }) {
  const { open, trade, allowedSlippage } = props

  if (!trade) return null

  const lineItemProps = { trade, allowedSlippage, syncing: false, open }

  return (
    <AnimatedDropdown
      open={open}
      springProps={{
        marginTop: open ? 0 : -12,
        config: {
          duration: ms('200ms'),
          easing: easings.easeOutSine,
        },
      }}
    >
      <Column gap="md">
        <AnimatedLineItem {...lineItemProps} type={SwapLineItemType.PRICE_IMPACT} delay={ms('50ms')} />
        <AnimatedLineItem {...lineItemProps} type={SwapLineItemType.MAX_SLIPPAGE} delay={ms('100ms')} />
        <AnimatedLineItem {...lineItemProps} type={SwapLineItemType.MINIMUM_OUTPUT} delay={ms('120ms')} />
        <AnimatedLineItem {...lineItemProps} type={SwapLineItemType.MAXIMUM_INPUT} delay={ms('120ms')} />
      </Column>
    </AnimatedDropdown>
  )
}
