import { useMemo } from 'react'
import { Flex, Separator, useExtractedTokenColor, useSporeColors } from 'ui/src'
import { Sign } from 'ui/src/components/icons/Sign'
import { Swap } from 'ui/src/components/icons/Swap'
import { DEP_accentColors, iconSizes } from 'ui/src/theme'
import { Step, StepDetails, StepStatus } from 'uniswap/src/components/ConfirmSwapModal/Step'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__'
import { useCurrencyInfo, useNativeCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { ClassicTrade, UniswapXTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionStep, TransactionStepType } from 'uniswap/src/features/transactions/swap/utils/generateSwapSteps'
import { t } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

const IconWrapper = ({ children }: { children: JSX.Element }): JSX.Element => {
  return (
    <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$neutral3">
      {children}
    </Flex>
  )
}

const SwapIcon = (): JSX.Element => (
  <IconWrapper>
    <Swap color="$neutral1" size="$icon.12" />
  </IconWrapper>
)

const SignIcon = (): JSX.Element => (
  <IconWrapper>
    <Sign size="$icon.12" />
  </IconWrapper>
)

export default function ProgressIndicator({
  steps,
  currentStep,
  trade,
}: {
  steps: TransactionStep[]
  currentStep?: { step: TransactionStep; accepted: boolean }
  trade: ClassicTrade | UniswapXTrade
}): JSX.Element | null {
  const colors = useSporeColors()
  const nativeCurrency = useNativeCurrencyInfo(trade?.inputAmount.currency.chainId)
  const currencyId = buildCurrencyId(
    trade?.inputAmount.currency.chainId as UniverseChainId,
    trade?.inputAmount.currency.isToken
      ? trade?.inputAmount.currency.address
      : trade.inputAmount.currency.wrapped.address,
  )
  const currencyInfo = useCurrencyInfo(currencyId)
  const inputTokenColor = useExtractedTokenColor(
    currencyInfo?.logoUrl,
    trade?.inputAmount.currency.symbol,
    /*background=*/ colors.surface1.val,
    /*default=*/ colors.neutral3.val,
  )

  function getStatus(targetStep: TransactionStep): StepStatus {
    const currentIndex = steps.findIndex((step) => step.type === currentStep?.step.type)
    const targetIndex = steps.indexOf(targetStep)
    if (currentIndex < targetIndex) {
      return StepStatus.Preview
    } else if (currentIndex === targetIndex) {
      return currentStep?.accepted ? StepStatus.InProgress : StepStatus.Active
    } else {
      return StepStatus.Complete
    }
  }

  const stepDetails: Record<TransactionStepType, StepDetails> = useMemo(
    () => ({
      [TransactionStepType.WrapTransaction]: {
        icon: <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} />,
        rippleColor: inputTokenColor.tokenColor ?? undefined,
        previewTitle: t('common.wrap', { symbol: nativeCurrency?.currency.symbol }),
        actionRequiredTitle: t('common.wrapIn', { symbol: nativeCurrency?.currency.symbol }),
        inProgressTitle: t('common.wrappingToken', { symbol: nativeCurrency?.currency.symbol }),
        learnMoreLinkText: t('common.whyWrap', { symbol: nativeCurrency?.currency.symbol }),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.wethExplainer,
      },
      [TransactionStepType.TokenRevocationTransaction]: {
        icon: <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} />,
        rippleColor: inputTokenColor.tokenColor ?? undefined,
        previewTitle: t('common.resetLimit', { symbol: currencyInfo?.currency.symbol }),
        actionRequiredTitle: t('common.resetLimitWallet', { symbol: currencyInfo?.currency.symbol }),
        inProgressTitle: t('common.resettingLimit', { symbol: currencyInfo?.currency.symbol }),
      },
      [TransactionStepType.TokenApprovalTransaction]: {
        icon: <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} />,
        rippleColor: inputTokenColor.tokenColor ?? undefined,
        previewTitle: t('common.approveSpend', { symbol: currencyInfo?.currency.symbol }),
        actionRequiredTitle: t('common.wallet.approve'),
        inProgressTitle: t('common.approvePending'),
        learnMoreLinkText: t('common.whyApprove'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.approvalsExplainer,
      },
      [TransactionStepType.Permit2Signature]: {
        icon: <SignIcon />,
        rippleColor: colors.accent1.val,
        previewTitle: t('common.signMessage'),
        actionRequiredTitle: t('common.signMessageWallet'),
        learnMoreLinkText: t('common.whySign'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.approvalsExplainer,
      },
      [TransactionStepType.SwapTransaction]: {
        icon: <SwapIcon />,
        rippleColor: DEP_accentColors.blue400,
        previewTitle: t('swap.confirmSwap'),
        actionRequiredTitle: t('common.confirmSwap'),
        inProgressTitle: t('common.swapPending'),
        ...(trade?.routing === Routing.DUTCH_V2 && {
          timeToStart: trade.order.info.deadline - Math.floor(Date.now() / 1000),
          delayedStartTitle: t('common.confirmTimedOut'),
        }),
        learnMoreLinkText: t('common.learnMoreSwap'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.howToSwapTokens,
      },
      [TransactionStepType.SwapTransactionAsync]: {
        icon: <SwapIcon />,
        rippleColor: DEP_accentColors.blue400,
        previewTitle: t('swap.confirmSwap'),
        actionRequiredTitle: t('common.confirmSwap'),
        inProgressTitle: t('common.swapPending'),
        learnMoreLinkText: t('common.learnMoreSwap'),
        learnMoreLinkHref: uniswapUrls.helpArticleUrls.howToSwapTokens,
      },
      [TransactionStepType.UniswapXSignature]: {
        icon: <SwapIcon />,
        rippleColor: DEP_accentColors.blue400,
        previewTitle: t('swap.confirmSwap'),
        actionRequiredTitle: t('common.confirmSwap'),
        inProgressTitle: t('common.swapPending'),
      },
    }),
    [trade, currencyInfo, inputTokenColor.tokenColor, nativeCurrency?.currency.symbol, colors.accent1],
  )

  if (steps.length === 0) {
    return null
  }

  return (
    <Flex px="$spacing12">
      <Separator my="$spacing12" />
      {steps.map((step, i) => {
        return (
          <Flex key={`progress-indicator-step-${i}`}>
            <Step stepDetails={stepDetails[step.type]} stepStatus={getStatus(step)} />
            {i !== steps.length - 1 && <Flex backgroundColor="$neutral3" height={10} mt={1} mx={11} width={2} />}
          </Flex>
        )
      })}
    </Flex>
  )
}
