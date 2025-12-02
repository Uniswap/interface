import { ConfirmModalState } from 'components/ConfirmSwapModal'
import { ICON_SIZE, Step, StepDetails } from 'components/ConfirmSwapModal/Step'
import Column from 'components/deprecated/Column'
import { Sign } from 'components/Icons/Sign'
import { Swap } from 'components/Icons/Swap'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { useAccount } from 'hooks/useAccount'
import { useBlockConfirmationTime } from 'hooks/useBlockConfirmationTime'
import { useColor } from 'hooks/useColor'
import { SwapResult, useSwapTransactionStatus } from 'hooks/useSwapCallback'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import styled, { useTheme } from 'lib/styled-components'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InterfaceTrade } from 'state/routing/types'
import { isLimitTrade, isUniswapXSwapTrade, isUniswapXTradeType } from 'state/routing/utils'
import { useIsTransactionConfirmed, useUniswapXOrderByOrderHash } from 'state/transactions/hooks'
import { colors } from 'theme/colors'
import { Divider } from 'theme/components/Dividers'
import { Flex } from 'ui/src'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { SignatureExpiredError } from 'utils/errors'

const DividerContainer = styled(Column)`
  height: 28px;
  padding: 0px 16px;
  justify-content: center;
`

type ProgressIndicatorStep = Extract<
  ConfirmModalState,
  | ConfirmModalState.APPROVING_TOKEN
  | ConfirmModalState.PERMITTING
  | ConfirmModalState.PENDING_CONFIRMATION
  | ConfirmModalState.WRAPPING
  | ConfirmModalState.RESETTING_TOKEN_ALLOWANCE
>
export default function ProgressIndicator({
  steps,
  currentStep,
  trade,
  swapResult,
  wrapTxHash,
  tokenApprovalPending = false,
  revocationPending = false,
  swapError,
  onRetryUniswapXSignature,
}: {
  steps: ProgressIndicatorStep[]
  currentStep: ProgressIndicatorStep
  trade?: InterfaceTrade
  swapResult?: SwapResult
  wrapTxHash?: string
  tokenApprovalPending?: boolean
  revocationPending?: boolean
  swapError?: Error | string
  onRetryUniswapXSignature?: () => void
}) {
  const { t } = useTranslation()
  const { chainId } = useAccount()
  const nativeCurrency = useNativeCurrency(chainId)
  const inputTokenColor = useColor(trade?.inputAmount.currency.wrapped)
  const theme = useTheme()

  // Dynamic estimation of transaction wait time based on confirmation of previous block
  const { blockConfirmationTime } = useBlockConfirmationTime()
  const [estimatedTransactionTime, setEstimatedTransactionTime] = useState<number>()
  useEffect(() => {
    // Value continuously updates as new blocks get confirmed
    // Only set step timers once to prevent resetting
    if (blockConfirmationTime && !estimatedTransactionTime) {
      // Add buffer to account for variable confirmation
      setEstimatedTransactionTime(Math.ceil(blockConfirmationTime * 1.2))
    }
  }, [blockConfirmationTime, estimatedTransactionTime])

  const swapStatus = useSwapTransactionStatus(swapResult)
  const uniswapXOrder = useUniswapXOrderByOrderHash(
    isUniswapXTradeType(swapResult?.type) ? swapResult.response.orderHash : '',
  )

  const swapConfirmed = swapStatus === TransactionStatus.Success || uniswapXOrder?.status === TransactionStatus.Success
  const wrapConfirmed = useIsTransactionConfirmed(wrapTxHash)

  const swapPending = swapResult !== undefined && !swapConfirmed
  const wrapPending = wrapTxHash !== undefined && !wrapConfirmed
  const transactionPending = revocationPending || tokenApprovalPending || wrapPending || swapPending

  // Retry logic for UniswapX orders when a signature expires
  const [signatureExpiredErrorId, setSignatureExpiredErrorId] = useState('')
  useEffect(() => {
    if (swapError instanceof SignatureExpiredError && swapError.id !== signatureExpiredErrorId) {
      setSignatureExpiredErrorId(swapError.id)
      onRetryUniswapXSignature?.()
    }
  }, [onRetryUniswapXSignature, signatureExpiredErrorId, swapError])

  function getStatus(targetStep: ProgressIndicatorStep) {
    const currentIndex = steps.indexOf(currentStep)
    const targetIndex = steps.indexOf(targetStep)
    if (currentIndex < targetIndex) {
      return StepStatus.Preview
    } else if (currentIndex === targetIndex) {
      return transactionPending ? StepStatus.InProgress : StepStatus.Active
    } else {
      return StepStatus.Complete
    }
  }

  const stepDetails: Record<ProgressIndicatorStep, StepDetails> = useMemo(
    () => ({
      [ConfirmModalState.WRAPPING]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} size={ICON_SIZE} />,
        rippleColor: inputTokenColor,
        previewTitle: t('common.wrap', { symbol: nativeCurrency.symbol }),
        actionRequiredTitle: t('common.wrapIn', { symbol: nativeCurrency.symbol }),
        inProgressTitle: t('common.wrappingToken', { symbol: nativeCurrency.symbol }),
        learnMoreLinkText: t('common.whyWrap', { symbol: nativeCurrency.symbol }),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.wethExplainer,
      },
      [ConfirmModalState.RESETTING_TOKEN_ALLOWANCE]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} size={ICON_SIZE} />,
        rippleColor: inputTokenColor,
        previewTitle: t('common.resetLimit', { symbol: trade?.inputAmount.currency.symbol }),
        actionRequiredTitle: t('common.resetLimitWallet', { symbol: trade?.inputAmount.currency.symbol }),
        inProgressTitle: t('common.resettingLimit', { symbol: trade?.inputAmount.currency.symbol }),
      },
      [ConfirmModalState.APPROVING_TOKEN]: {
        icon: <CurrencyLogo currency={trade?.inputAmount.currency} size={ICON_SIZE} />,
        rippleColor: inputTokenColor,
        previewTitle: t('common.approveSpend', { symbol: trade?.inputAmount.currency.symbol }),
        actionRequiredTitle: t('common.wallet.approve'),
        inProgressTitle: t('common.approvePending'),
        learnMoreLinkText: t('common.whyApprove'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.approvalsExplainer,
      },
      [ConfirmModalState.PERMITTING]: {
        icon: <Sign />,
        rippleColor: theme.accent1,
        previewTitle: t('common.signMessage'),
        actionRequiredTitle: t('common.signMessageWallet'),
        learnMoreLinkText: t('common.whySign'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.approvalsExplainer,
      },
      [ConfirmModalState.PENDING_CONFIRMATION]: {
        icon: <Swap />,
        rippleColor: colors.blue400,
        previewTitle: isLimitTrade(trade) ? t('common.confirm') : t('swap.confirmSwap'),
        actionRequiredTitle: isLimitTrade(trade) ? t('common.confirmWallet') : t('common.confirmSwap'),
        inProgressTitle: isLimitTrade(trade) ? t('common.pendingEllipsis') : t('common.swapPending'),
        ...(isUniswapXSwapTrade(trade) && {
          timeToStart: trade.order.info.deadline - Math.floor(Date.now() / 1000),
          delayedStartTitle: t('common.confirmTimedOut'),
        }),
        learnMoreLinkText: isLimitTrade(trade) ? t('limits.learnMore') : t('common.learnMoreSwap'),
        learnMoreLinkHref: isLimitTrade(trade)
          ? uniswapUrls.helpArticleUrls.limitsInfo
          : uniswapUrls.helpArticleUrls.howToSwapTokens,
      },
    }),
    [trade, inputTokenColor, t, nativeCurrency.symbol, theme.accent1],
  )

  if (steps.length === 0) {
    return null
  }

  return (
    <Flex>
      <DividerContainer>
        <Divider />
      </DividerContainer>
      {steps.map((step, i) => {
        return (
          <Flex key={`progress-indicator-step-${i}`}>
            <Step stepStatus={getStatus(step)} stepDetails={stepDetails[step]} />
            {i !== steps.length - 1 && <Flex width={2} height={10} backgroundColor="$neutral3" ml={18} />}
          </Flex>
        )
      })}
    </Flex>
  )
}
