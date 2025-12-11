import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { Contract } from 'ui/src/components/icons/Contract'
import { Sign } from 'ui/src/components/icons/Sign'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Permit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { Permit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'

const SignIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$accent1">
    <Sign size="$icon.12" />
  </Flex>
)

export function Permit2SignatureStepRow({
  status,
  currentStepIndex,
  totalStepsCount,
}: StepRowProps<Permit2SignatureStep>): JSX.Element {
  const { t } = useTranslation()

  const title = status === StepStatus.Active ? t('common.signMessageWallet') : t('common.signMessage')

  return (
    <StepRowSkeleton
      title={title}
      icon={<SignIcon />}
      learnMore={{
        url: uniswapUrls.helpArticleUrls.approvalsExplainer,
        text: t('common.whySign'),
      }}
      status={status}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}

const ContractIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$accent1">
    <Contract size="$icon.24" />
  </Flex>
)

export function Permit2TransactionStepRow({
  step,
  status,
  currentStepIndex,
  totalStepsCount,
  currentIndexOfStepType,
  totalCountOfStepType,
}: StepRowProps<Permit2TransactionStep> & {
  currentIndexOfStepType: number
  totalCountOfStepType?: number
}): JSX.Element {
  const { t } = useTranslation()

  const indexText =
    totalCountOfStepType && totalCountOfStepType > 1 ? ` (${currentIndexOfStepType + 1}/${totalCountOfStepType})` : ''

  const title = {
    [StepStatus.Preview]: t('common.approvePermitTx', { indexText }),
    [StepStatus.Active]: t('common.approvePermitTx.active', { indexText }),
    [StepStatus.InProgress]: t('common.approvePermitTx.pending', { indexText }),
    [StepStatus.Complete]: t('common.approvePermitTx', { indexText }),
  }[status]

  return (
    <StepRowSkeleton
      title={title}
      icon={<ContractIcon />}
      learnMore={{
        url: uniswapUrls.helpArticleUrls.mismatchedImports,
        text: t('common.approvePermitTx.explainer'),
      }}
      status={status}
      currentStepIndex={currentStepIndex}
      totalStepsCount={totalStepsCount}
    />
  )
}
