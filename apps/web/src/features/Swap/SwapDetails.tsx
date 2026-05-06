import { Currency, Percent } from '@uniswap/sdk-core'
import { PropsWithChildren, ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text, TouchableArea } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { ElementName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { AutoRow, RowBetween } from '~/components/deprecated/Row'
import { LimitDisclaimer } from '~/components/LimitDisclaimer'
import { SwapCallbackError, SwapShowAcceptChanges } from '~/features/Swap/styled'
import SwapLineItem, { SwapLineItemType } from '~/features/Swap/SwapLineItem'
import { Allowance, AllowanceState } from '~/hooks/usePermit2Allowance'
import { SwapResult } from '~/hooks/useSwapCallback'
import { InterfaceTrade, LimitOrderTrade, RouterPreference } from '~/state/routing/types'
import { isLimitTrade } from '~/state/routing/utils'
import { useRouterPreference, useUserSlippageTolerance } from '~/state/user/hooks'
import { ExternalLink } from '~/theme/components/Links'
import { formatSwapButtonClickEventProperties } from '~/utils/loggingFormatters'

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
  const { t } = useTranslation()
  return (
    <TouchableArea
      px="$spacing16"
      my="$spacing4"
      height={28}
      alignItems="center"
      backgroundColor="transparent"
      activeOpacity={1}
      hoverable={false}
      onPress={onClick}
    >
      <Separator />
      <Flex row alignItems="center" mr={-6} px="$spacing16" minWidth="fit-content" flexShrink={0}>
        <Text variant="body3" color="$neutral2" whiteSpace="nowrap">
          {children ? children : open ? t('common.showLess.button') : t('common.showMore.button')}
        </Text>
        {open ? <ChevronsIn color="$neutral2" size="$icon.16" /> : <ChevronsOut color="$neutral2" size="$icon.16" />}
      </Flex>
      <Separator />
    </TouchableArea>
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
      <Flex gap="$gap8" px="$spacing12" pb="$spacing8">
        {isLimitTrade(trade) ? (
          <>
            <Separator />
            <LimitLineItems trade={trade} />
          </>
        ) : null}
      </Flex>
      {showAcceptChanges ? (
        <SwapShowAcceptChanges data-testid="show-accept-changes">
          <RowBetween>
            <Flex row gap="$gap8">
              <AlertTriangleFilled size={20} color="$accent1" />
              <Text variant="body2" color="$accent1">
                {t('common.priceUpdated')}
              </Text>
            </Flex>
            <Flex>
              <Button size="small" variant="branded" onPress={onAcceptChanges}>
                {t('common.accept')}
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
              <Flex centered width="100%" mt="$spacing16" mb="$spacing4">
                <ExternalLink href={callToAction.helpLink.url}>{callToAction.helpLink.text}</ExternalLink>
              </Flex>
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
