import { TradingApi } from '@universe/api'
import { useEffect, useMemo, useRef } from 'react'
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated'
import { Button, Flex, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import { CustomButtonFrame } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/CustomButtonFrame'
import { ThemedSpinningLoader } from 'ui/src/components/buttons/Button/components/ThemedSpinnerLoader'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import type { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { getPlanProgressEstimates, PlanProgressEstimates } from 'uniswap/src/features/transactions/swap/plan/utils'
import { DelayedSubmissionText } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/DelayedSubmissionText'
import { useSwapReviewStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface PendingSwapButtonProps {
  disabled: boolean
  onSubmit: () => void
  warning?: Warning
}

/**
 *  Max visual width of the progress bar in percentage to show
 * that it's not complete even thought the estimated time has passed.
 */
const PROGRESS_BAR_MAX_WIDTH = 99
/**
 * Min visual width of the progress bar in percentage to show
 * that it's started even thought no progress has been made yet.
 */
const PROGRESS_BAR_MIN_WIDTH = 1
/**
 * Calculates the progress of the swap in percentage based on the number of steps
 * that a swap needs to take.
 *
 * // TODO: SWAP-706 Subject to change based on final UX designs
 *
 * @returns The progress shared value and animated style for the progress bar
 */
function useSwapProgressState(): {
  progress: ReturnType<typeof useSharedValue<number>>
  animatedStyle: ReturnType<typeof useAnimatedStyle>
} {
  const { currentStep, steps } = useSwapReviewStore((s) => ({
    currentStep: s.currentStep,
    steps: s.steps,
  }))
  const progressEstimatesRef = useRef<PlanProgressEstimates | null>(null)

  if (!progressEstimatesRef.current && steps.length > 0) {
    progressEstimatesRef.current = getPlanProgressEstimates(steps as unknown as TradingApi.PlanStep[])
  }

  const progress = useSharedValue(PROGRESS_BAR_MIN_WIDTH)

  const currentStepIndex = useMemo(() => {
    const _currentStepIndex =
      currentStep && 'step' in currentStep && 'stepIndex' in currentStep.step
        ? (currentStep.step as unknown as TradingApi.PlanStep).stepIndex
        : -1
    if (_currentStepIndex === -1) {
      return _currentStepIndex
    }

    return steps.findIndex((step) => 'stepIndex' in step && step.stepIndex === _currentStepIndex)
  }, [steps, currentStep])

  useEffect(() => {
    if (currentStepIndex === -1 || !progressEstimatesRef.current) {
      return
    }
    const { totalTime, stepTimings, stepPercentageRanges } = progressEstimatesRef.current

    const stepProgress = stepPercentageRanges[currentStepIndex]

    if (!stepProgress) {
      return
    }
    const currentStepDuration = stepTimings[currentStepIndex] ?? totalTime

    progress.value = withSequence(
      withTiming(stepProgress.min, {
        duration: ONE_SECOND_MS / 2,
      }),
      withTiming(Math.min(stepProgress.max, PROGRESS_BAR_MAX_WIDTH), {
        duration: currentStepDuration,
      }),
    )
  }, [currentStepIndex])

  const animatedStyle = useAnimatedStyle(() => {
    const clampedProgress = Math.max(progress.value, PROGRESS_BAR_MIN_WIDTH)
    return {
      width: `${clampedProgress}%`,
    }
  }, [progress])

  return {
    progress,
    animatedStyle,
  }
}

/**
 * Button used after the user has submitted a swap and the swap is pending. If progress is updated
 * it will animate a progress bar.
 */
export function PendingSwapButton({ disabled, onSubmit }: PendingSwapButtonProps): JSX.Element {
  const { animatedStyle } = useSwapProgressState()
  const colors = useSporeColors()

  const isShortMobileDevice = useIsShortMobileDevice()
  const size = isShortMobileDevice ? 'medium' : 'large'

  const buttonPadding = CustomButtonFrame.staticConfig.variants?.size?.[size]
  const px = buttonPadding && 'px' in buttonPadding ? buttonPadding.px : 0
  const py = buttonPadding && 'py' in buttonPadding ? buttonPadding.py : 0

  const icon = useMemo(() => {
    return (
      <ThemedSpinningLoader isDisabled={false} emphasis="secondary" size={size} variant="branded" typeOfButton="icon" />
    )
  }, [size])

  return (
    <Button
      variant="branded"
      emphasis="primary"
      testID={TestID.Swap}
      overflow="hidden"
      p={0}
      isDisabled={disabled}
      size={size}
      onPress={onSubmit}
    >
      <Flex row mx={px} my={py} width="100%" height="100%" alignItems="center" justifyContent="center" gap="$spacing12">
        {icon}
        <AnimatedFlex
          style={animatedStyle}
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          height="100%"
          zIndex={0}
          backgroundColor={colors.accent2.val}
        />
        <DelayedSubmissionText color={colors.accent1.val} />
      </Flex>
    </Button>
  )
}
