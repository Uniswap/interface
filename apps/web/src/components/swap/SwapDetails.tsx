import { Currency, Percent } from '@uniswap/sdk-core'
import { ReactComponent as ExpandoIconClosed } from 'assets/svg/expando-icon-closed.svg'
import { ReactComponent as ExpandoIconOpened } from 'assets/svg/expando-icon-opened.svg'
import Column from 'components/deprecated/Column'
import { AutoRow, RowBetween } from 'components/deprecated/Row'
import { LimitDisclaimer } from 'components/swap/LimitDisclaimer'
import SwapLineItem, { SwapLineItemType } from 'components/swap/SwapLineItem'
import { SwapCallbackError, SwapShowAcceptChanges } from 'components/swap/styled'
import { Allowance, AllowanceState } from 'hooks/usePermit2Allowance'
import { SwapResult } from 'hooks/useSwapCallback'
import { deprecatedStyled } from 'lib/styled-components'
import { PropsWithChildren, ReactNode, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { InterfaceTrade, LimitOrderTrade, RouterPreference } from 'state/routing/types'
import { isLimitTrade } from 'state/routing/utils'
import { useRouterPreference, useUserSlippageTolerance } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { Button, Flex, Separator, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ElementName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { formatSwapButtonClickEventProperties } from 'utils/loggingFormatters'

const DetailsContainer = deprecatedStyled(Column)`
  padding: 0px 12px 8px;
`

const DropdownControllerWrapper = deprecatedStyled.div`
  display: flex;
  align-items: center;
  margin-right: -6px;

  padding: 0 16px;
  min-width: fit-content;
  white-space: nowrap;
`

const DropdownButton = deprecatedStyled.button`
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

const HelpLink = deprecatedStyled(ExternalLink)`
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

// TODO: Extract to Spore ExpandoRow component (WEB-7906)
export function DropdownController({
  open,
  onClick,
  children,
}: PropsWithChildren & { open: boolean; onClick: () => void }) {
  return (
    <DropdownButton onClick={onClick}>
      <Separator />
      <DropdownControllerWrapper>
        <ThemedText.BodySmall color="neutral2">
          {children ? (
            children
          ) : open ? (
            <Trans i18nKey="common.showLess.button" />
          ) : (
            <Trans i18nKey="common.showMore.button" />
          )}
        </ThemedText.BodySmall>
        {open ? <ExpandoIconOpened /> : <ExpandoIconClosed />}
      </DropdownControllerWrapper>
      <Separator />
    </DropdownButton>
  )
}

/**
 * IMPORTANT: This legacy component is only used for web LIMIT orders and assumes `trade` is a `LimitOrderTrade`,
 *            even though there are some `isLimitTrade` calls. This should eventually be cleaned up or deprecated.
 */
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
}) {
  const { t } = useTranslation()
  const isAutoSlippage = useUserSlippageTolerance()[0] === 'auto'
  const [routerPreference] = useRouterPreference()

  const analyticsContext = useTrace()

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
        ) : null}
      </DetailsContainer>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges data-testid="show-accept-changes">
          <RowBetween>
            <Flex row gap="$gap8">
              <AlertTriangleFilled size={20} color="$accent1" />
              <Text variant="body2" color="$accent1">
                <Trans i18nKey="common.priceUpdated" />
              </Text>
            </Flex>
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
            element={ElementName.ConfirmSwapButton}
            eventOnTrigger={SwapEventName.SwapSubmittedButtonClicked}
            properties={{
              ...formatSwapButtonClickEventProperties({
                trade,
                inputCurrency,
                swapResult,
                allowedSlippage,
                isAutoSlippage,
                isAutoRouterApi: routerPreference === RouterPreference.API,
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
              id={ElementName.ConfirmSwapButton}
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
