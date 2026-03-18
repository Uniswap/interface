import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Sign } from '~/components/Icons/Sign'
import { Swap } from '~/components/Icons/Swap'
import { useColor } from '~/hooks/useColor'
import { ICON_SIZE, Step, StepDetails } from '~/pages/Swap/Limit/ConfirmSwapModal/Step'
import { ConfirmModalState } from '~/pages/Swap/Limit/ConfirmSwapModal/state'
import { Divider } from '~/theme/components/Dividers'

export type ProgressIndicatorStep = Extract<
  ConfirmModalState,
  ConfirmModalState.APPROVING_TOKEN | ConfirmModalState.PERMITTING | ConfirmModalState.PENDING_CONFIRMATION
>

interface BidProgressIndicatorProps {
  steps: ProgressIndicatorStep[]
  currentStep: ProgressIndicatorStep
  bidCurrencySymbol?: string
  bidCurrencyInfo?: CurrencyInfo | null
  auctionTokenInfo?: CurrencyInfo | null
  tokenApprovalPending?: boolean
  permit2ApprovalPending?: boolean
  isSubmitting?: boolean
}

export function BidProgressIndicator({
  steps,
  currentStep,
  bidCurrencySymbol,
  bidCurrencyInfo,
  auctionTokenInfo,
  tokenApprovalPending = false,
  permit2ApprovalPending = false,
  isSubmitting = false,
}: BidProgressIndicatorProps) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const tokenColor = useColor(bidCurrencyInfo?.currency.wrapped)

  const transactionPending =
    (currentStep === ConfirmModalState.APPROVING_TOKEN && tokenApprovalPending) ||
    (currentStep === ConfirmModalState.PERMITTING && permit2ApprovalPending) ||
    (currentStep === ConfirmModalState.PENDING_CONFIRMATION && isSubmitting)

  function getStatus(targetStep: ProgressIndicatorStep) {
    const currentIndex = steps.indexOf(currentStep)
    const targetIndex = steps.indexOf(targetStep)
    if (currentIndex < targetIndex) {
      return StepStatus.Preview
    }
    if (currentIndex === targetIndex) {
      return transactionPending ? StepStatus.InProgress : StepStatus.Active
    }
    return StepStatus.Complete
  }

  const stepDetails: Record<ProgressIndicatorStep, StepDetails> = useMemo(
    () => ({
      [ConfirmModalState.APPROVING_TOKEN]: {
        icon: bidCurrencyInfo ? <CurrencyLogo currencyInfo={bidCurrencyInfo} size={ICON_SIZE} /> : <Swap />,
        rippleColor: tokenColor,
        previewTitle: t('common.approveSpend', { symbol: bidCurrencySymbol }),
        actionRequiredTitle: t('common.wallet.approve'),
        inProgressTitle: t('common.approvePending'),
        learnMoreLinkText: t('common.whyApprove'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.approvalsExplainer,
      },
      [ConfirmModalState.PERMITTING]: {
        icon: <Sign />,
        rippleColor: colors.accent1.val,
        previewTitle: t('common.approveSpend', { symbol: 'Permit2' }),
        actionRequiredTitle: t('common.wallet.approve'),
        inProgressTitle: t('common.approvePending'),
        learnMoreLinkText: t('common.whyApprove'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.approvalsExplainer,
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: {
        icon: auctionTokenInfo ? <CurrencyLogo currencyInfo={auctionTokenInfo} size={ICON_SIZE} /> : <Swap />,
        rippleColor: colors.accent1.val,
        previewTitle: t('toucan.bidReview.placeBid'),
        actionRequiredTitle: t('common.confirmWallet'),
        inProgressTitle: t('common.pendingEllipsis'),
      },
    }),
    [auctionTokenInfo, bidCurrencyInfo, bidCurrencySymbol, colors.accent1.val, t, tokenColor],
  )

  if (steps.length === 0) {
    return null
  }

  return (
    <Flex>
      <Flex px="$spacing16" py="$spacing8">
        <Divider />
      </Flex>
      {steps.map((step, index) => (
        <Flex key={`bid-progress-step-${index}`}>
          <Step stepStatus={getStatus(step)} stepDetails={stepDetails[step]} />
          {index !== steps.length - 1 && <Flex width={2} height={10} backgroundColor="$neutral3" ml={18} />}
        </Flex>
      ))}
    </Flex>
  )
}
