import React from 'react'
import { useAppTheme } from 'src/app/hooks'
import { Caret } from 'src/components/icons/Caret'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Theme } from 'ui/src/theme/restyle'
import { formatNumber, NumberType } from 'utilities/src/format/format'

interface RelativeChangeProps {
  change?: number
  absoluteChange?: number
  variant?: keyof Theme['textVariants']
  semanticColor?: boolean // If true, entire % change text will render green or red
  positiveChangeColor?: keyof Theme['colors']
  negativeChangeColor?: keyof Theme['colors']
  arrowSize?: number
  loading?: boolean
  alignRight?: boolean
}

export function RelativeChange(props: RelativeChangeProps): JSX.Element {
  const theme = useAppTheme()
  const {
    absoluteChange,
    change,
    variant = 'subheadSmall',
    semanticColor,
    positiveChangeColor = 'statusSuccess',
    negativeChangeColor = 'statusCritical',
    arrowSize = theme.iconSizes.icon16,
    loading = false,
    alignRight = false,
  } = props

  const isPositiveChange = change !== undefined ? change >= 0 : undefined
  const arrowColor = isPositiveChange
    ? theme.colors[positiveChangeColor]
    : theme.colors[negativeChangeColor]

  const formattedChange = change !== undefined ? `${Math.abs(change).toFixed(2)}%` : '-'
  const formattedAbsChange = absoluteChange
    ? `${formatNumber(Math.abs(absoluteChange), NumberType.PortfolioBalance)}`
    : ''

  return (
    <Flex
      row
      alignItems="center"
      gap="spacing2"
      justifyContent={alignRight ? 'flex-end' : 'flex-start'}>
      {change !== undefined && (
        <Caret color={arrowColor} direction={isPositiveChange ? 'n' : 's'} size={arrowSize} />
      )}
      <Text
        color={semanticColor ? (isPositiveChange ? 'statusSuccess' : 'statusCritical') : 'neutral2'}
        loading={loading}
        loadingPlaceholderText="$0.00 (0.00)%"
        variant={variant}>
        {absoluteChange ? `${formattedAbsChange} (${formattedChange})` : formattedChange}
      </Text>
    </Flex>
  )
}
