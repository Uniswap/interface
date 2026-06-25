import { useTranslation } from 'react-i18next'
import { Flex, getTokenValue, Separator, Text, useSporeColors, VerticalDottedLineSeparator } from 'ui/src'
import { Rocket } from 'ui/src/components/icons/Rocket'
import { zIndexes } from 'ui/src/theme'
import {
  STEP_ROW_HEIGHT,
  STEP_ROW_ICON_SIZE,
  StepRowSkeleton,
} from 'uniswap/src/components/ConfirmSwapModal/steps/StepRowSkeleton'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CreateAuctionTokenLogo } from '~/pages/Liquidity/CreateAuction/components/CreateAuctionTokenLogo'

function LaunchIcon(): JSX.Element {
  return (
    <Flex centered width="$spacing24" height="$spacing24" borderRadius="$roundedFull" backgroundColor="$accent1">
      <Rocket color="$white" size="$icon.12" />
    </Flex>
  )
}

export enum LaunchProgressStep {
  ApproveToken = 'ApproveToken',
  PendingConfirmation = 'PendingConfirmation',
}

interface LaunchAuctionProgressIndicatorProps {
  steps: LaunchProgressStep[]
  currentStepIndex: number
  tokenSymbol: string
  submitting: boolean
}

export function LaunchAuctionProgressIndicator({
  steps,
  currentStepIndex,
  tokenSymbol,
  submitting,
}: LaunchAuctionProgressIndicatorProps): JSX.Element | null {
  const { t } = useTranslation()

  function getStatus(targetIndex: number): StepStatus {
    if (currentStepIndex < targetIndex) {
      return StepStatus.Preview
    }
    if (currentStepIndex === targetIndex) {
      return submitting ? StepStatus.InProgress : StepStatus.Active
    }
    return StepStatus.Complete
  }

  if (steps.length === 0) {
    return null
  }

  const iconSize = getTokenValue(STEP_ROW_ICON_SIZE)

  return (
    <Flex
      testID={TestID.LaunchAuctionProgressIndicator}
      enterStyle={{ opacity: 0 }}
      animation="quicker"
      animateOnly={['transform', 'opacity']}
      gap="$spacing16"
    >
      <Flex row gap="$spacing12" alignItems="center">
        <Separator my="$spacing12" />
        <Text color="$neutral2" variant="body3">
          {t('swap.review.continueInWallet')}
        </Text>
        <Separator my="$spacing12" />
      </Flex>
      <Flex pr="$spacing8">
        {steps.map((step, index) => {
          const stepStatus = getStatus(index)
          const isNotLastStep = index < steps.length - 1
          const nextStepStatus = isNotLastStep ? getStatus(index + 1) : null
          const isActiveAdjacent = stepStatus === StepStatus.Active || nextStepStatus === StepStatus.Active
          const isApproval = step === LaunchProgressStep.ApproveToken
          return (
            <Flex key={`launch-progress-step-${index}`}>
              <StepRowSkeleton
                status={stepStatus}
                title={
                  isApproval ? t('common.approveSpend', { symbol: tokenSymbol }) : t('toucan.createAuction.launchToken')
                }
                icon={isApproval ? <CreateAuctionTokenLogo size={iconSize} hideNetworkLogo /> : <LaunchIcon />}
                learnMore={
                  isApproval
                    ? { url: UniswapHelpUrls.articles.approvalsExplainer, text: t('common.whyApprove') }
                    : undefined
                }
                currentStepIndex={index}
                totalStepsCount={steps.length}
              />
              {isNotLastStep && <StepRowSeparator isActiveAdjacent={isActiveAdjacent} />}
            </Flex>
          )
        })}
      </Flex>
    </Flex>
  )
}

function StepRowSeparator({ isActiveAdjacent }: { isActiveAdjacent: boolean }): JSX.Element {
  const colors = useSporeColors()
  const rowHeight = getTokenValue(STEP_ROW_HEIGHT)
  const iconSize = getTokenValue(STEP_ROW_ICON_SIZE)

  const strokeWidth = 2
  const marginLeftForStroke = rowHeight / 2 - strokeWidth / 2
  const marginTop = (rowHeight + iconSize) / 2
  const extraMarginTop = marginTop + 2
  const spaceBetweenRows = (rowHeight + iconSize) / 4

  return (
    <Flex
      position="absolute"
      zIndex={zIndexes.negative}
      top={isActiveAdjacent ? extraMarginTop : marginTop}
      left={marginLeftForStroke}
      height={spaceBetweenRows}
      width={strokeWidth}
    >
      <VerticalDottedLineSeparator strokeWidth={strokeWidth} strokeColor={colors.neutral3.val} />
    </Flex>
  )
}
