import { useTranslation } from 'react-i18next'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { TokenRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

export function TokenApprovalTransactionStepRow({
  step,
  status,
  currentStepIndex,
  totalStepsCount,
}: StepRowProps<TokenApprovalTransactionStep>): JSX.Element {
  const { t } = useTranslation()

  const { chainId, tokenAddress, pair } = step
  const currencyInfo = useCurrencyInfo(buildCurrencyId(chainId, tokenAddress))
  const symbol = currencyInfo?.currency.symbol ?? ''

  const title = {
    [StepStatus.Preview]: t('common.approveSpend', { symbol }),
    [StepStatus.Active]: t('common.wallet.approve'),
    [StepStatus.InProgress]: t('common.approvePending'),
    [StepStatus.Complete]: t('common.approvedSpend', { symbol }),
  }[status]

  return (
    <StepRowSkeleton
      title={title}
      currency={currencyInfo?.currency}
      pair={pair}
      learnMore={{
        url: uniswapUrls.helpArticleUrls.approvalsExplainer,
        text: t('common.whyApprove'),
      }}
      status={status}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}

export function TokenRevocationTransactionStepRow(props: StepRowProps<TokenRevocationTransactionStep>): JSX.Element {
  const { step, status, currentStepIndex, totalStepsCount } = props
  const { chainId, tokenAddress } = step

  const currencyInfo = useCurrencyInfo(buildCurrencyId(chainId, tokenAddress))
  const { t } = useTranslation()
  const symbol = currencyInfo?.currency.symbol ?? ''

  const title = {
    [StepStatus.Preview]: t('common.resetLimit', { symbol }),
    [StepStatus.Active]: t('common.resetLimitWallet', { symbol }),
    [StepStatus.InProgress]: t('common.resettingLimit', { symbol }),
    [StepStatus.Complete]: t('common.resetLimit', { symbol }),
  }[status]

  return (
    <StepRowSkeleton
      title={title}
      currency={currencyInfo?.currency}
      status={status}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}
