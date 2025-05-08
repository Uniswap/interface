import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { Swap } from 'ui/src/components/icons/Swap' // TODO: update to LP icon
import { StepRowProps, StepRowSkeleton } from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import {
  CollectFeesSteps,
  DecreasePositionTransactionStep,
  IncreasePositionTransactionStep,
  IncreasePositionTransactionStepAsync,
  MigratePositionTransactionStep,
  MigratePositionTransactionStepAsync,
} from 'uniswap/src/features/transactions/swap/types/steps'

const LPIcon = (): JSX.Element => (
  <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$DEP_blue400">
    <Swap color="$neutral1" size="$icon.12" />
  </Flex>
)

type LPSteps =
  | IncreasePositionTransactionStep
  | IncreasePositionTransactionStepAsync
  | DecreasePositionTransactionStep
  | MigratePositionTransactionStep
  | MigratePositionTransactionStepAsync
  | CollectFeesSteps
export function LPTransactionStepRow({ status }: StepRowProps<LPSteps>): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const title = {
    [StepStatus.Preview]: t('common.confirmWallet'),
    [StepStatus.Active]: t('common.confirmWallet'),
    [StepStatus.InProgress]: t('common.transactionPending'),
    [StepStatus.Complete]: t('common.confirmWallet'),
  }[status]

  return (
    <StepRowSkeleton
      title={title}
      icon={<LPIcon />}
      learnMore={{
        url: uniswapUrls.helpArticleUrls.howToSwapTokens,
        text: t('common.learnMoreSwap'),
      }}
      rippleColor={colors.DEP_blue400.val}
      status={status}
    />
  )
}
