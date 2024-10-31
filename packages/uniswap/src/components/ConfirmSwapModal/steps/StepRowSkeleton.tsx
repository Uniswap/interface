import { Currency } from '@uniswap/sdk-core'
import { PropsWithChildren, useMemo } from 'react'
import { Anchor, ColorTokens, Flex, SpinningLoader, Text, useExtractedTokenColor, useSporeColors } from 'ui/src'
import { Check } from 'ui/src/components/icons/Check'
import { PulseRipple } from 'ui/src/loading/PulseRipple'
import { fonts, iconSizes, spacing } from 'ui/src/theme'
import { StepStatus } from 'uniswap/src/components/ConfirmSwapModal/types'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { currencyId } from 'uniswap/src/utils/currencyId'

export interface StepRowProps<TStepType extends TransactionStep> {
  step: TStepType
  status: StepStatus
}

interface StepRowSkeletonProps {
  /** If passed, the step row icon will be the currency logo. */
  currency?: Currency
  /** Icon to display if there is no currency to be displayed for this step. */
  icon?: JSX.Element
  /** Color to display for the ripple effect around the icon or currency logo. This will default to a currency logo extracted color, if currency is defined. */
  rippleColor?: string
  status: StepStatus
  title: string
  secondsRemaining?: number
  learnMore?: { url: string; text: string }
}

export function StepRowSkeleton(props: StepRowSkeletonProps): JSX.Element {
  const { currency, icon, secondsRemaining, title, learnMore, status, rippleColor } = props
  const colors = useSporeColors()

  const currencyInfo = useCurrencyInfo(currency ? currencyId(currency) : undefined)
  const { tokenColor } = useExtractedTokenColor(
    currencyInfo?.logoUrl,
    currency?.symbol,
    /*background=*/ colors.surface1.val,
    /*default=*/ colors.neutral3.val,
  )

  const titleColor = status === StepStatus.Active || status === StepStatus.InProgress ? '$neutral1' : '$neutral2'

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <Flex row alignItems="center" gap="$gap12" height="$spacing40" justifyContent="space-between" py={8}>
        <StepIconWrapper rippleColor={rippleColor ?? tokenColor ?? undefined} stepStatus={status}>
          {icon ?? <CurrencyLogo currencyInfo={currencyInfo} size={iconSizes.icon24} />}
        </StepIconWrapper>
        <Flex>
          <Text color={titleColor} variant="body3">
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
      {status === StepStatus.Complete && <Check color="$statusSuccess" size={iconSizes.icon16} />}
    </Flex>
  )
}

function StepIconWrapper({
  children,
  rippleColor,
  stepStatus,
}: PropsWithChildren<{
  stepStatus: StepStatus
  rippleColor?: string
}>): JSX.Element {
  if (stepStatus === StepStatus.InProgress) {
    return (
      <Flex mr={3}>
        <SpinningLoader color={rippleColor as ColorTokens} size={21} />
      </Flex>
    )
  }
  return (
    <Flex>
      {stepStatus === StepStatus.Active && <PulseRipple rippleColor={rippleColor} />}
      <Flex
        data-testid="step-icon"
        filter={stepStatus === StepStatus.Active ? 'grayscale(0)' : 'grayscale(1)'}
        height="$spacing24"
        opacity={stepStatus === StepStatus.Active ? 1 : 0.5}
        width="$spacing24"
      >
        {children}
      </Flex>
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
