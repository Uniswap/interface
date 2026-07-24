import { Currency, Percent } from '@uniswap/sdk-core'
import { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { ElementName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { LimitDisclaimer } from '~/components/LimitDisclaimer'
import { Allowance, AllowanceState } from '~/hooks/usePermit2Allowance'
import { LimitOrderCallbackError } from '~/pages/Swap/Limit/LimitOrderCallbackError'
import { LimitOrderLineItem, LimitOrderLineItemType } from '~/pages/Swap/Limit/LimitOrderLineItem'
import { InterfaceTrade, LimitOrderTrade, RouterPreference } from '~/state/routing/types'
import { isLimitTrade } from '~/state/routing/utils'
import { useRouterPreference, useUserSlippageTolerance } from '~/state/user/hooks'
import { ExternalLink } from '~/theme/components/Links'
import type { LimitOrderResult } from '~/types/trade'
import { formatSwapButtonClickEventProperties } from '~/utils/loggingFormatters'

interface CallToAction {
  buttonText: string
  helpLink?: HelpLink
}

interface HelpLink {
  text: string
  url: string
}

/**
 * IMPORTANT: This legacy component is only used for web LIMIT orders and assumes `trade` is a `LimitOrderTrade`,
 *            even though there are some `isLimitTrade` calls. This should eventually be cleaned up or deprecated.
 */
export function LimitOrderDetails({
  trade,
  inputCurrency,
  allowance,
  allowedSlippage,
  limitOrderResult,
  onConfirm,
  limitOrderErrorMessage,
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
  limitOrderResult?: LimitOrderResult
  allowedSlippage: Percent
  onConfirm: () => void
  limitOrderErrorMessage?: ReactNode
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
        <Flex backgroundColor="$accent2" p="$spacing12" borderRadius="$rounded12" data-testid="show-accept-changes">
          <Flex row width="100%" justifyContent="space-between" alignItems="center">
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
          </Flex>
        </Flex>
      ) : (
        <Flex row flexWrap="wrap" width="100%">
          <Trace
            logPress
            element={ElementName.ConfirmSwapButton}
            eventOnTrigger={SwapEventName.SwapSubmittedButtonClicked}
            properties={{
              ...formatSwapButtonClickEventProperties({
                trade,
                inputCurrency,
                limitOrderResult,
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
              data-testid={TestID.ConfirmSwapButton}
              loading={isLoading}
              onPress={onConfirm}
              disabled={disabledConfirm}
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

          {limitOrderErrorMessage ? <LimitOrderCallbackError error={limitOrderErrorMessage} /> : null}
        </Flex>
      )}
    </>
  )
}

function LimitLineItems({ trade }: { trade: LimitOrderTrade }) {
  return (
    <>
      <LimitOrderLineItem trade={trade} type={LimitOrderLineItemType.EXCHANGE_RATE} />
      <LimitOrderLineItem trade={trade} type={LimitOrderLineItemType.EXPIRY} />
      <LimitOrderLineItem trade={trade} type={LimitOrderLineItemType.SWAP_FEE} />
      <LimitOrderLineItem trade={trade} type={LimitOrderLineItemType.NETWORK_COST} />
      <LimitDisclaimer />
    </>
  )
}
