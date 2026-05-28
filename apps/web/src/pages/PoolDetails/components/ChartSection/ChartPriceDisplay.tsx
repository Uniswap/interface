import { Flex, Text, styled } from 'ui/src'
import { EllipsisTamaguiStyle } from '~/theme/components/styles'

export const PriceDisplayContainer = styled(Flex, {
  flexWrap: 'wrap',
  columnGap: '$spacing4',
})

export const ChartPriceText = styled(Text, {
  variant: 'heading3',
  ...EllipsisTamaguiStyle,
})
