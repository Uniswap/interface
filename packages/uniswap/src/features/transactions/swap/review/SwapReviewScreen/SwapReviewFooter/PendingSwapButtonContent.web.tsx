import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, CustomButtonFrame, Flex, ThemedSpinningLoader, useIsShortMobileDevice, useSporeColors } from 'ui/src'
import {
  getPlanProgressEstimates,
  NO_ANIMATION_INDEX,
  PlanProgressEstimates,
  PlanProgressStep,
} from 'uniswap/src/features/transactions/swap/plan/utils'
import { DelayedSubmissionText } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/DelayedSubmissionText'
import { ONE_SECOND_MS } from 'utilities/src/time/time'

interface PendingSwapButtonContentProps {
  disabled: boolean
  onSubmit: () => void
  currentStepIndex: number
  steps: readonly PlanProgressStep[] | undefined
  submissionText?: string
  testID?: string
}

/**
 * Max visual width of the progress bar in percentage to show
 * that it's not complete even thought the estimated time has passed.
 */
const PROGRESS_BAR_MAX_WIDTH = 99.5
/**
 * Min visual width of the progress bar in percentage to show
 * that it's started even thought no progress has been made yet.
 */
const PROGRESS_BAR_MIN_WIDTH = 0.5

/**
 * Web-specific hook that calculates and animates the swap progress using CSS transitions.
 */
function useSwapProgressState({
  currentStepIndex,
  steps,
}: Pick<PendingSwapButtonContentProps, 'currentStepIndex' | 'steps'>): {
  progress: number
  transitionDuration: number
} {
  const [progress, setProgress] = useState(PROGRESS_BAR_MIN_WIDTH)
  const [transitionDuration, setTransitionDuration] = useState(ONE_SECOND_MS / 2)

  const progressEstimatesRef = useRef<PlanProgressEstimates | null>(null)

  if (!progressEstimatesRef.current && steps && steps.length > 0) {
    progressEstimatesRef.current = getPlanProgressEstimates(steps)
  }

  useEffect(() => {
    if (currentStepIndex === NO_ANIMATION_INDEX || !progressEstimatesRef.current) {
      return undefined
    }
    const { totalTime, stepTimings, stepPercentageRanges } = progressEstimatesRef.current

    const stepProgress = stepPercentageRanges[currentStepIndex]

    if (!stepProgress) {
      return undefined
    }
    const currentStepDuration = stepTimings[currentStepIndex] ?? totalTime

    // First animate to min quickly
    setTransitionDuration(ONE_SECOND_MS / 2)
    setProgress(stepProgress.min)

    // Then animate to max over the step duration
    const timeoutId = setTimeout(() => {
      setTransitionDuration(currentStepDuration)
      setProgress(Math.min(stepProgress.max, PROGRESS_BAR_MAX_WIDTH))
    }, ONE_SECOND_MS / 2)

    return () => clearTimeout(timeoutId)
  }, [currentStepIndex])

  return {
    progress: Math.max(progress, PROGRESS_BAR_MIN_WIDTH),
    transitionDuration,
  }
}

/**
 * Presentational pending button shown while a chained plan executes. Progress arrives via props,
 * so it renders without the swap review store providers.
 * Uses CSS transitions for progress animation instead of react-native-reanimated.
 */
export function PendingSwapButtonContent({
  disabled,
  onSubmit,
  currentStepIndex,
  steps,
  submissionText,
  testID,
}: PendingSwapButtonContentProps): JSX.Element {
  const { progress, transitionDuration } = useSwapProgressState({ currentStepIndex, steps })
  const colors = useSporeColors()

  const isShortMobileDevice = useIsShortMobileDevice()
  const size = isShortMobileDevice ? 'medium' : 'large'

  const buttonPadding = CustomButtonFrame.staticConfig.variants?.['size']?.[size]
  const px = buttonPadding && 'px' in buttonPadding ? buttonPadding['px'] : 0
  const py = buttonPadding && 'py' in buttonPadding ? buttonPadding['py'] : 0

  const icon = useMemo(() => {
    return (
      <ThemedSpinningLoader isDisabled={false} emphasis="secondary" size={size} variant="branded" typeOfButton="icon" />
    )
  }, [size])

  return (
    <Button
      variant="branded"
      emphasis="primary"
      testID={testID}
      overflow="hidden"
      p={0}
      disabled={disabled}
      size={size}
      onPress={onSubmit}
    >
      <Flex row mx={px} my={py} width="100%" height="100%" alignItems="center" justifyContent="center" gap="$spacing12">
        {icon}
        <Flex
          position="absolute"
          top={0}
          left={0}
          bottom={0}
          height="100%"
          zIndex={0}
          backgroundColor={colors.accent2.val}
          style={{
            width: `${progress}%`,
            transition: `width ${transitionDuration}ms ease-out`,
          }}
        />
        {submissionText ? (
          <Button.Text color={colors.accent1.val}>{submissionText}</Button.Text>
        ) : (
          <DelayedSubmissionText color={colors.accent1.val} />
        )}
      </Flex>
    </Button>
  )
}
