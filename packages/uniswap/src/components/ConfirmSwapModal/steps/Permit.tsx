import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { Sign } from 'ui/src/components/icons/Sign'
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Permit2SignatureStep } from 'uniswap/src/features/transactions/swap/types/steps'

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
