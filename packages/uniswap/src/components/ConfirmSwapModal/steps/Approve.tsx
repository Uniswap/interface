import { useTranslation } from 'react-i18next'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  TokenApprovalTransactionStep,
  TokenRevocationTransactionStep,
} from 'uniswap/src/features/transactions/swap/types/steps'

export function TokenApprovalTransactionStepRow({
  step,
  status,
}: StepRowProps<TokenApprovalTransactionStep>): JSX.Element {
  const { t } = useTranslation()
  const { token, pair } = step
  const symbol = token.symbol ?? ''

  const title = {
    [StepStatus.Preview]: t('common.approveSpend', { symbol }),
    [StepStatus.Active]: t('common.wallet.approve'),
    [StepStatus.InProgress]: t('common.approvePending'),
    [StepStatus.Complete]: t('common.approveSpend', { symbol }),
  }[status]

  return (
    <StepRowSkeleton
      title={title}
      currency={token}
      pair={pair}
      learnMore={{
        url: uniswapUrls.helpArticleUrls.approvalsExplainer,
        text: t('common.whyApprove'),
      }}
      status={status}
    />
  )
}

export function TokenRevocationTransactionStepRow(props: StepRowProps<TokenRevocationTransactionStep>): JSX.Element {
  const { step, status } = props

  const { t } = useTranslation()
  const { token } = step
  const symbol = token.symbol ?? ''

  const title = {
    [StepStatus.Preview]: t('common.resetLimit', { symbol }),
    [StepStatus.Active]: t('common.resetLimitWallet', { symbol }),
    [StepStatus.InProgress]: t('common.resettingLimit', { symbol }),
    [StepStatus.Complete]: t('common.resetLimit', { symbol }),
  }[status]

  return <StepRowSkeleton title={title} currency={token} status={status} />
}
