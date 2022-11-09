import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Arrow } from 'src/components/icons/Arrow'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'
import { formatNumber, NumberType } from 'src/utils/format'

interface RelativeChangeProps {
  change?: number
  absoluteChange?: number
  variant?: keyof Theme['textVariants']
  semanticColor?: boolean // If true, entire % change text will render green or red
  isWarmLoading?: boolean
  positiveChangeColor?: keyof Theme['colors']
  negativeChangeColor?: keyof Theme['colors']
}

export function RelativeChange(props: RelativeChangeProps) {
  const theme = useAppTheme()
  const {
    absoluteChange,
    change,
    variant = 'subheadSmall',
    semanticColor,
    positiveChangeColor = 'accentSuccess',
    negativeChangeColor = 'accentCritical',
  } = props

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const arrowColor = isPositiveChange
    ? theme.colors[positiveChangeColor]
    : theme.colors[negativeChangeColor]

  return (
    <Flex row alignItems="center" gap="xxs" justifyContent="flex-end">
      {change !== undefined && (
        <Arrow color={arrowColor} direction={isPositiveChange ? 'ne' : 'se'} size={16} />
      )}
      <Text
        color={
          semanticColor ? (isPositiveChange ? 'accentSuccess' : 'accentCritical') : 'textSecondary'
        }
        variant={variant}>
        {change ? `${Math.abs(change).toFixed(2)}%` : '-'}
        {absoluteChange ? `(${formatNumber(absoluteChange, NumberType.FiatTokenPrice)})` : ''}
      </Text>
    </Flex>
  )
}
