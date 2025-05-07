import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
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

export function Permit2SignatureStepRow({ status }: StepRowProps<Permit2SignatureStep>): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const title = status === StepStatus.Active ? t('common.signMessageWallet') : t('common.signMessage')

  return (
    <StepRowSkeleton
      title={title}
      icon={<SignIcon />}
      learnMore={{
        url: uniswapUrls.helpArticleUrls.approvalsExplainer,
        text: t('common.whySign'),
      }}
      rippleColor={colors.accent1.val}
      status={status}
    />
  )
}

const ContractIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$accent1">
    <Contract size="$icon.24" />
  </Flex>
)
const CONTRACT_ICON_COLOR = '#00C3A0'

export function Permit2TransactionStepRow({
  status,
  index,
  count,
}: StepRowProps<Permit2TransactionStep> & { index: number; count?: number }): JSX.Element {
  const { t } = useTranslation()

  const indexText = count && count > 1 ? ` (${index + 1}/${count})` : ''

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
      rippleColor={CONTRACT_ICON_COLOR}
      learnMore={{
        url: uniswapUrls.helpArticleUrls.mismatchedImports,
        text: t('common.approvePermitTx.explainer'),
      }}
      status={status}
    />
  )
}
