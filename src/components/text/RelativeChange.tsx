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
  positiveChangeColor?: keyof Theme['colors']
  negativeChangeColor?: keyof Theme['colors']
  arrowSize?: number
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
    arrowSize = theme.iconSizes.sm,
  } = props

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const arrowColor = isPositiveChange
    ? theme.colors[positiveChangeColor]
    : theme.colors[negativeChangeColor]

  const formattedChange = change ? `${Math.abs(change).toFixed(2)}%` : '-'
  const formattedAbsChange = absoluteChange
    ? `${formatNumber(Math.abs(absoluteChange), NumberType.PortfolioBalance)}`
    : ''

  return (
    <Flex row alignItems="center" gap="xxs">
      {change !== undefined && (
        <Arrow color={arrowColor} direction={isPositiveChange ? 'ne' : 'se'} size={arrowSize} />
      )}
      <Text
        color={
          semanticColor ? (isPositiveChange ? 'accentSuccess' : 'accentCritical') : 'textSecondary'
        }
        variant={variant}>
        {absoluteChange ? `${formattedAbsChange} (${formattedChange})` : formattedChange}
      </Text>
    </Flex>
  )
}
