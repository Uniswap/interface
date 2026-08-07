import { lighten } from 'polished'
import { PropsWithChildren, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text, useSporeColors, WaveLoader, type FlexProps } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { ChartType } from '~/components/Charts/utils'
import { ChartBarCrossedWithBackground } from '~/components/Table/ErrorBox'

const ERROR_WIDTH = 320

type ChartSkeletonProps = {
  height: number
  errorText?: ReactNode
  errorTitle?: ReactNode
  errorColor?: string
  errorBackgroundColor?: string
  errorBorderColor?: string
  type: ChartType
  disabled?: boolean
  hideYAxis?: boolean
  hideXAxis?: boolean
  hidePriceIndicators?: boolean
} & Omit<FlexProps, 'children' | 'height' | 'disabled'>

function ChartErrorView({
  title,
  backgroundColor = '$surface1',
  borderColor = '$surface3',
  children,
}: PropsWithChildren<{ title?: ReactNode; backgroundColor?: string; borderColor?: string }>) {
  const { t } = useTranslation()
  return (
    <Flex
      data-cy="chart-error-view"
      row
      alignItems="flex-start"
      justifyContent="flex-start"
      position="absolute"
      width="max-content"
      maxWidth={ERROR_WIDTH}
      top="50%"
      left="50%"
      transform="translate(-50%, -50%)"
      borderRadius="$rounded20"
      borderWidth={1.3}
      borderColor={borderColor}
      backgroundColor={backgroundColor}
      p="$spacing12"
      pr="$spacing20"
      gap="$gap12"
      zIndex={1}
      animation="125ms"
      animateOnly={['opacity']}
      enterStyle={{ opacity: 0 }}
    >
      <ChartBarCrossedWithBackground />
      <Flex shrink gap="$gap4">
        <Text variant="subheading2" color="$neutral1">
          {title ?? t('chart.missingData')}
        </Text>
        <Text variant="body3" color="$neutral2">
          {children}
        </Text>
      </Flex>
    </Flex>
  )
}

function ChartSkeletonAxes({
  height,
  fillColor,
  tickColor,
  hideYAxis,
  hideXAxis,
  hidePriceIndicators,
}: {
  height: number
  fillColor: string
  tickColor: string
  hideYAxis?: boolean
  hideXAxis?: boolean
  hidePriceIndicators?: boolean
}) {
  return (
    <svg
      width="100%"
      height={height}
      preserveAspectRatio="none"
      viewBox={`0 0 726 ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g>
        {!hidePriceIndicators && <rect width="180" height="32" rx="4" y="0" fill={fillColor} />}
        {!hidePriceIndicators && <rect width="80" height="13" rx="4" y="48" fill={fillColor} />}
        {!hideXAxis && (
          <g transform={`translate(0, ${height - 14})`}>
            <rect width="7%" height="6" rx="3" x="10%" fill={tickColor} />
            <rect width="7%" height="6" rx="3" x="28.25%" fill={tickColor} />
            <rect width="7%" height="6" rx="3" x="46.5%" fill={tickColor} />
            <rect width="7%" height="6" rx="3" x="64.75%" fill={tickColor} />
            <rect width="7%" height="6" rx="3" x="83%" fill={tickColor} />
          </g>
        )}
        {!hideYAxis && (
          <g transform="translate(0, 10)">
            <rect width="24" height="6" rx="3" y={(0 * height) / 5} x="96%" fill={tickColor} />
            <rect width="24" height="6" rx="3" y={(1 * height) / 5} x="96%" fill={tickColor} />
            <rect width="24" height="6" rx="3" y={(2 * height) / 5} x="96%" fill={tickColor} />
            <rect width="24" height="6" rx="3" y={(3 * height) / 5} x="96%" fill={tickColor} />
            <rect width="24" height="6" rx="3" y={(4 * height) / 5} x="96%" fill={tickColor} />
          </g>
        )}
      </g>
    </svg>
  )
}

function ChartLoadingState({
  type,
  height,
  id,
  color,
  disabled,
  hideYAxis,
}: {
  type: ChartType
  height: number
  id: string
  color: string
  disabled: boolean
  hideYAxis?: boolean
}): JSX.Element | null {
  const colors = useSporeColors()

  switch (type) {
    case ChartType.TVL:
    case ChartType.PRICE:
      return (
        <Flex position="absolute" inset={0} width={hideYAxis ? '100%' : '94%'}>
          <WaveLoader height={height} disabled={disabled} color={color} />
        </Flex>
      )
    case ChartType.VOLUME:
      return (
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 726 ${height}`}
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          <defs>
            <linearGradient id={`${id}-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0" stopColor={colors.neutral3.val}>
                <animate attributeName="offset" values="-0.2;3.3" dur="1.3s" repeatCount="indefinite" />
              </stop>
              <stop offset="0.1" stopColor={lighten(0.05, colors.neutral3.val)}>
                <animate attributeName="offset" values="-0.1;3.4" dur="1.3s" repeatCount="indefinite" />
              </stop>
              <stop offset="0.2" stopColor={colors.neutral3.val}>
                <animate attributeName="offset" values="0;3.5" dur="1.3s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
          </defs>
          <mask id={id} style={{ maskType: 'alpha' }}>
            <g transform={`translate(0, ${height - 30}) scale(1,-1)`}>
              <rect rx="3" width="9%" height="15%" x="0.0%" fill="white" />
              <rect rx="3" width="9%" height="30%" x="9.2%" fill="white" />
              <rect rx="3" width="9%" height="45%" x="18.4%" fill="white" />
              <rect rx="3" width="9%" height="60%" x="27.6%" fill="white" />
              <rect rx="3" width="9%" height="45%" x="36.8%" fill="white" />
              <rect rx="3" width="9%" height="30%" x="46.0%" fill="white" />
              <rect rx="3" width="9%" height="15%" x="55.2%" fill="white" />
              <rect rx="3" width="9%" height="30%" x="64.4%" fill="white" />
              <rect rx="3" width="9%" height="45%" x="73.6%" fill="white" />
              <rect rx="3" width="9%" height="60%" x="82.8%" fill="white" />
            </g>
          </mask>
          <g mask={`url(#${id})`}>
            <rect width="94%" height={height} rx="4" fill={disabled ? color : `url(#${id}-gradient)`} />
          </g>
        </svg>
      )
    default:
      return null
  }
}

export function ChartSkeleton({
  errorText,
  errorTitle,
  errorColor,
  errorBackgroundColor,
  errorBorderColor,
  height,
  type,
  disabled = false,
  hideYAxis,
  hideXAxis,
  hidePriceIndicators,
  ...flexProps
}: ChartSkeletonProps) {
  const colors = useSporeColors()
  const neutral3 = colors.neutral3.val

  const hasError = Boolean(errorText)
  const isDisabled = disabled || hasError
  const skeletonColor = isDisabled ? (errorColor ?? opacify(12.5, neutral3)) : neutral3

  const maskId = `mask-${type}-${height}`

  return (
    <Flex row width="100%" alignItems="center" position="relative" {...flexProps}>
      <Shine fill disabled={isDisabled}>
        <Flex>
          <ChartLoadingState
            type={type}
            height={height}
            id={maskId}
            color={skeletonColor}
            disabled={isDisabled}
            hideYAxis={hideYAxis}
          />
          <ChartSkeletonAxes
            height={height}
            fillColor={skeletonColor}
            tickColor={skeletonColor}
            hideYAxis={hideYAxis}
            hideXAxis={hideXAxis}
            hidePriceIndicators={hidePriceIndicators}
          />
          {hasError && (
            <ChartErrorView title={errorTitle} backgroundColor={errorBackgroundColor} borderColor={errorBorderColor}>
              {errorText}
            </ChartErrorView>
          )}
        </Flex>
      </Shine>
    </Flex>
  )
}
