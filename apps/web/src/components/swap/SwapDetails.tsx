import { InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Currency, Percent } from '@uniswap/sdk-core'
import { ReactComponent as ExpandoIconClosed } from 'assets/svg/expando-icon-closed.svg'
import { ReactComponent as ExpandoIconOpened } from 'assets/svg/expando-icon-opened.svg'
import Column from 'components/deprecated/Column'
import { AutoRow, RowBetween, RowFixed } from 'components/deprecated/Row'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import SwapLineItem, { SwapLineItemType } from 'components/swap/SwapLineItem'
import { SwapCallbackError, SwapShowAcceptChanges } from 'components/swap/styled'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult } from 'hooks/useSwapCallback'
import styled, { useTheme } from 'lib/styled-components'
import ms from 'ms'
import { ReactNode, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Trans, useTranslation } from 'react-i18next'
import { InterfaceTrade, LimitOrderTrade, RouterPreference } from 'state/routing/types'
import { isClassicTrade, isLimitTrade } from 'state/routing/utils'
import { useRouterPreference, useUserSlippageTolerance } from 'state/user/hooks'
import { Separator, ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { Button, Flex, HeightAnimator } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'
import { formatSwapButtonClickEventProperties } from 'utils/loggingFormatters'

const DetailsContainer = styled(Column)`
  padding: 0px 12px 8px;
`

const StyledAlertTriangle = styled(AlertTriangle)`
  margin-right: 8px;
  min-width: 24px;
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
  padding: 0px 16px;
  margin-top: 4px;
  margin-bottom: 4px;
  height: 28px;
  text-decoration: none;
  display: flex;
  background: none;
  border: none;
  align-items: center;
  cursor: pointer;
`

const HelpLink = styled(ExternalLink)`
  width: 100%;
  text-align: center;
  margin-top: 16px;
  margin-bottom: 4px;
`

interface CallToAction {
  buttonText: string
  helpLink?: HelpLink
}

interface HelpLink {
  text: string
  url: string
}

function DropdownController({ open, onClick }: { open: boolean; onClick: () => void }) {
  return (
    <DropdownButton onClick={onClick}>
      <Separator />
      <DropdownControllerWrapper>
        <ThemedText.BodySmall color="neutral2">
          {open ? <Trans i18nKey="common.showLess.button" /> : <Trans i18nKey="common.showMore.button" />}
        </ThemedText.BodySmall>
        {open ? <ExpandoIconOpened /> : <ExpandoIconClosed />}
      </DropdownControllerWrapper>
      <Separator />
    </DropdownButton>
  )
}

export function SwapDetails({
  trade,
  inputCurrency,
  allowance,
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
  priceImpact,
}: {
  trade: InterfaceTrade
  inputCurrency?: Currency
  allowance?: Allowance
  swapResult?: SwapResult
  allowedSlippage: Percent
  onConfirm: () => void
  swapErrorMessage?: ReactNode
  disabledConfirm: boolean
  fiatValueInput: { data?: number; isLoading: boolean }
  fiatValueOutput: { data?: number; isLoading: boolean }
  showAcceptChanges: boolean
  onAcceptChanges?: () => void
  isLoading: boolean
  priceImpact?: Percent
}) {
  const { t } = useTranslation()
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [routerPreference] = useRouterPreference()
  const routes = isClassicTrade(trade) ? getRoutingDiagramEntries(trade) : undefined
  const theme = useTheme()
  const [showMore, setShowMore] = useState(false)

  const analyticsContext = useTrace()

  const lineItemProps = { trade, allowedSlippage, syncing: false, priceImpact }

  const callToAction: CallToAction = useMemo(() => {
    if (allowance && allowance.state === AllowanceState.REQUIRED && allowance.needsSetupApproval) {
      return {
        buttonText: isLimitTrade(trade) ? t('swap.approveAndSubmit') : t('swap.approveAndSwap'),
      }
    } else if (allowance && allowance.state === AllowanceState.REQUIRED && allowance.needsPermitSignature) {
      return {
        buttonText: t('swap.signAndSwap'),
      }
    } else {
      return {
        buttonText: isLimitTrade(trade) ? t('swap.placeOrder') : t('swap.confirmSwap'),
      }
    }
  }, [allowance, t, trade])

  return (
    <>
      <DetailsContainer gap="sm">
        {isLimitTrade(trade) ? (
          <>
            <Separator />
            <LimitLineItems trade={trade} />
          </>
        ) : (
          <>
            <DropdownController open={showMore} onClick={() => setShowMore(!showMore)} />
            <SwapLineItems showMore={showMore} {...lineItemProps} />
          </>
        )}
      </DetailsContainer>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges data-testid="show-accept-changes">
          <RowBetween>
            <RowFixed>
              <StyledAlertTriangle size={20} />
              <ThemedText.DeprecatedMain color={theme.accent1}>
                <Trans i18nKey="common.priceUpdated" />
              </ThemedText.DeprecatedMain>
            </RowFixed>
            <Flex>
              <Button size="small" variant="branded" onPress={onAcceptChanges}>
                <Trans i18nKey="common.accept" />
              </Button>
            </Flex>
          </RowBetween>
        </SwapShowAcceptChanges>
      ) : (
        <AutoRow>
          <Trace
            logPress
            element={InterfaceElementName.CONFIRM_SWAP_BUTTON}
            eventOnTrigger={SwapEventName.SWAP_SUBMITTED_BUTTON_CLICKED}
            properties={{
              ...formatSwapButtonClickEventProperties({
                trade,
                inputCurrency,
                swapResult,
                allowedSlippage,
                isAutoSlippage,
                isAutoRouterApi: routerPreference === RouterPreference.API,
                routes,
                fiatValueInput: fiatValueInput.data,
                fiatValueOutput: fiatValueOutput.data,
              }),
              ...analyticsContext,
            }}
          >
            <Button
              variant="branded"
              data-testid="confirm-swap-button"
              loading={isLoading}
              onPress={onConfirm}
              isDisabled={disabledConfirm}
              id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
            >
              {isLoading ? t('swap.finalizingQuote') : callToAction.buttonText}
            </Button>
            {callToAction.helpLink && (
              <HelpLink href={callToAction.helpLink.url}>{callToAction.helpLink.text}</HelpLink>
            )}
          </Trace>

          {swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
        </AutoRow>
      )}
    </>
  )
}

function SwapLineItems({
  showMore,
  trade,
  allowedSlippage,
  syncing,
  priceImpact,
}: {
  showMore: boolean
  trade: InterfaceTrade
  allowedSlippage: Percent
  syncing: boolean
  priceImpact?: Percent
}) {
  return (
    <>
      <SwapLineItem
        trade={trade}
        allowedSlippage={allowedSlippage}
        syncing={syncing}
        type={SwapLineItemType.EXCHANGE_RATE}
      />
      <ExpandableLineItems trade={trade} allowedSlippage={allowedSlippage} open={showMore} priceImpact={priceImpact} />
      <SwapLineItem
        trade={trade}
        allowedSlippage={allowedSlippage}
        syncing={syncing}
        type={SwapLineItemType.INPUT_TOKEN_FEE_ON_TRANSFER}
      />
      <SwapLineItem
        trade={trade}
        allowedSlippage={allowedSlippage}
        syncing={syncing}
        type={SwapLineItemType.OUTPUT_TOKEN_FEE_ON_TRANSFER}
      />
      <SwapLineItem
        trade={trade}
        allowedSlippage={allowedSlippage}
        syncing={syncing}
        type={SwapLineItemType.SWAP_FEE}
      />
      <SwapLineItem
        trade={trade}
        allowedSlippage={allowedSlippage}
        syncing={syncing}
        type={SwapLineItemType.NETWORK_COST}
      />
    </>
  )
}

function ExpandableLineItems(props: {
  trade: InterfaceTrade
  allowedSlippage: Percent
  open: boolean
  priceImpact?: Percent
}) {
  const { open, trade, allowedSlippage, priceImpact } = props

  if (!trade) {
    return null
  }

  const lineItemProps = { trade, allowedSlippage, syncing: false, priceImpact }

  return (
    <HeightAnimator open={open} mt={open ? 0 : -8}>
      <Flex gap="$gap8">
        <SwapLineItem
          {...lineItemProps}
          visible={open}
          type={SwapLineItemType.PRICE_IMPACT}
          animationDelay={ms('50ms')}
        />
        <SwapLineItem
          {...lineItemProps}
          visible={open}
          type={SwapLineItemType.MAX_SLIPPAGE}
          animationDelay={ms('100ms')}
        />
        <SwapLineItem
          {...lineItemProps}
          visible={open}
          type={SwapLineItemType.MINIMUM_OUTPUT}
          animationDelay={ms('120ms')}
        />
        <SwapLineItem
          {...lineItemProps}
          visible={open}
          type={SwapLineItemType.MAXIMUM_INPUT}
          animationDelay={ms('120ms')}
        />
      </Flex>
    </HeightAnimator>
  )
}

function LimitLineItems({ trade }: { trade: LimitOrderTrade }) {
  return (
    <>
      <SwapLineItem trade={trade} type={SwapLineItemType.EXCHANGE_RATE} />
      <SwapLineItem trade={trade} type={SwapLineItemType.EXPIRY} />
      <SwapLineItem trade={trade} type={SwapLineItemType.SWAP_FEE} />
      <SwapLineItem trade={trade} type={SwapLineItemType.NETWORK_COST} />
      <LimitDisclaimer />
    </>
  )
}
