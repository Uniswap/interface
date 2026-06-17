import { Flex, Text, styled } from 'ui/src'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

export const PriceDisplayContainer = styled(Flex, {
  row: true,
  flexWrap: 'wrap',
  alignItems: 'center',
  columnGap: '$spacing8',
})

export const ChartPriceText = styled(Text, {
  variant: 'heading3',
  ...EllipsisTamaguiStyle,
})
