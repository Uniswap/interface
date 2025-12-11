import { Currency } from '@uniswap/sdk-core'
import { PropsWithChildren, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { Anchor, Flex, getTokenValue, Text, useSporeColors } from 'ui/src'
import { ApproveAlt } from 'ui/src/components/icons'
import { AvatarPlaceholder } from 'ui/src/components/icons/AvatarPlaceholder'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { PulseRipple } from 'ui/src/loading/PulseRipple'
import { fonts, spacing } from 'ui/src/theme'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { currencyId } from 'uniswap/src/utils/currencyId'

export const STEP_ROW_HEIGHT = '$spacing40'
export const STEP_ROW_ICON_SIZE = '$icon.24'

export interface StepRowProps<TStepType extends TransactionStep> {
  step: TStepType
  status: StepStatus
  currentStepIndex: number
  totalStepsCount: number
}

interface StepRowSkeletonProps {
  /** If passed, the step row icon will be the currency logo. */
  currency?: Currency
  /** If passed, the step row icon will be the split currency logo. */
  pair?: [Currency, Currency]
  /** Icon to display if there is no currency to be displayed for this step. */
  icon?: JSX.Element
  status: StepStatus
  title: string
  secondsRemaining?: number
  learnMore?: { url: string; text: string }
  currentStepIndex: number
  totalStepsCount: number
}

export function StepRowSkeleton(props: StepRowSkeletonProps): JSX.Element {
  const { currency, icon, secondsRemaining, title, learnMore, status, pair, currentStepIndex, totalStepsCount } = props

  const currencyInfo = useCurrencyInfo(currency ? currencyId(currency) : undefined)

  // For V2 liquidity positions the user is generated a unique token which is
  // the actual token they are approving, but since this token doesn't have
  // a logo we use the SplitLogo component to display the pair logos instead.
  const currency0Id = pair?.[0] ? currencyId(pair[0]) : undefined
  const currency1Id = pair?.[1] ? currencyId(pair[1]) : undefined
  const currency0Info = useCurrencyInfo(currency0Id)
  const currency1Info = useCurrencyInfo(currency1Id)

  const activeOrInProgress = status === StepStatus.Active || status === StepStatus.InProgress
  const titleColor = activeOrInProgress ? '$neutral1' : '$neutral2'
  const titleSize = activeOrInProgress ? 'body2' : 'body3'
  const iconSize = getTokenValue(STEP_ROW_ICON_SIZE)

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center" gap="$gap8" height="$spacing40" justifyContent="space-between" py={8}>
        <StepIconWrapper stepStatus={status} iconSize={iconSize}>
          {currency0Info && currency1Info ? (
            <SplitLogo
              size={iconSize}
              chainId={currency0Info.currency.chainId}
              inputCurrencyInfo={currency0Info}
              outputCurrencyInfo={currency1Info}
            />
          ) : (
            (icon ?? <CurrencyLogo currencyInfo={currencyInfo} size={iconSize} />)
          )}
        </StepIconWrapper>
        <Flex>
          <Text color={titleColor} variant={titleSize}>
            {title}
          </Text>
          {status === StepStatus.Active && learnMore && (
            <Anchor
              color="$accent1"
              fontSize={fonts.body4.fontSize}
              href={learnMore.url}
              lineHeight={spacing.spacing16}
              target="_blank"
              textDecorationLine="none"
            >
              {learnMore.text}
            </Anchor>
          )}
        </Flex>
      </Flex>
      {!!secondsRemaining && <Timer secondsRemaining={secondsRemaining} />}
      <RightSide status={status} currentStepIndex={currentStepIndex} totalStepsCount={totalStepsCount} />
    </Flex>
  )
}

export function StepIconWrapper({
  children,
  stepStatus,
  iconSize,
}: PropsWithChildren<{
  stepStatus: StepStatus
  rippleColor?: string
  iconSize: number
}>): JSX.Element {
  const layoutSize = (iconSize / 6) * 10
  const centerOffset = (layoutSize - iconSize) / 2
  const colors = useSporeColors()

  const renderContent = (): JSX.Element | null => {
    switch (stepStatus) {
      case StepStatus.Active:
        return (
          <>
            <Flex position="absolute" top={centerOffset} left={centerOffset}>
              <PulseRipple rippleColor={colors.accent1.val} size={iconSize} />
            </Flex>
            <Flex data-testid="step-icon" height={iconSize} width={iconSize} opacity={1} filter="grayscale(0)">
              {children}
            </Flex>
          </>
        )

      case StepStatus.InProgress:
        return <SpinningBorderIcon layoutSize={layoutSize}>{children}</SpinningBorderIcon>

      case StepStatus.Complete:
      case StepStatus.Preview:
        return <AvatarPlaceholder color="$neutral3" size={iconSize} />

      default:
        return null
    }
  }

  return (
    <Flex alignItems="center" justifyContent="center" height={layoutSize} width={layoutSize} position="relative">
      {renderContent()}
    </Flex>
  )
}

export function SpinningBorderIcon({
  children,
  layoutSize,
}: PropsWithChildren<{ children: React.ReactNode; layoutSize: number }>): JSX.Element {
  const rotation = useSharedValue(0)

  useEffect(() => {
    cancelAnimation(rotation)
    rotation.value = 0
    rotation.value = withRepeat(withTiming(360, { duration: 750, easing: Easing.linear }), -1)
    return (): void => cancelAnimation(rotation)
  }, [])

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ rotate: `${rotation.value}deg` }],
    }),
    [rotation],
  )

  const outerRadius = layoutSize * 0.8
  const spinnerWidth = outerRadius / 10
  const borderRadius = outerRadius / 2

  return (
    <Flex height={layoutSize} width={layoutSize} alignItems="center" justifyContent="center">
      <AnimatedFlex
        position="absolute"
        height={outerRadius}
        width={outerRadius}
        borderRadius={borderRadius}
        borderWidth={spinnerWidth}
        borderColor="$accent1"
        borderLeftColor="transparent"
        borderBottomColor="transparent"
        borderRightColor="transparent"
        style={animatedStyle}
      />
      {children}
    </Flex>
  )
}

function Timer({ secondsRemaining }: { secondsRemaining: number }): JSX.Element | null {
  const timerText = useMemo(() => {
    const minutes = Math.floor(secondsRemaining / 60)
    const seconds = secondsRemaining % 60
    const minutesText = minutes < 10 ? `0${minutes}` : minutes
    const secondsText = seconds < 10 ? `0${seconds}` : seconds
    return `${minutesText}:${secondsText}`
  }, [secondsRemaining])

  return (
    <Text data-testid="step-timer" fontSize={14} fontWeight="500" pr={8}>
      {timerText}
    </Text>
  )
}

function RightSide({
  status,
  currentStepIndex,
  totalStepsCount,
}: {
  status: StepStatus
  currentStepIndex: number
  totalStepsCount: number
}): JSX.Element | null {
  const { t } = useTranslation()

  switch (status) {
    case StepStatus.Complete:
      return <ApproveAlt color="$statusSuccess" size="$icon.20" />
    case StepStatus.Active:
    case StepStatus.InProgress:
      return (
        <Text color="$neutral3" variant="body4">
          {t('swap.review.stepXofN', { currentStep: currentStepIndex + 1, totalSteps: totalStepsCount })}
        </Text>
      )
    default:
      return null
  }
}
