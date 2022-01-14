import {
  color,
  ColorProps,
  createRestyleComponent,
  createVariant,
  typography,
  TypographyProps,
  useTheme,
  VariantProps,
} from '@shopify/restyle'
import React from 'react'
import {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated'
import { ReText, round } from 'react-native-redash'
import { Flex } from 'src/components/layout/Flex'
import { HEIGHT, WIDTH } from 'src/components/PriceChart/Model'
import {
  AnimatedNumber,
  AnimatedTranslation,
  GraphMetadatas,
} from 'src/components/PriceChart/types'
import { Theme } from 'src/styles/theme'

interface HeaderProps {
  graphs: GraphMetadatas
  index: AnimatedNumber
  isPanning: SharedValue<boolean>
  title: string
  translation: AnimatedTranslation
}

const StyledReText = createRestyleComponent<
  VariantProps<Theme, 'textVariants'> &
    TypographyProps<Theme> &
    ColorProps<Theme> &
    React.ComponentProps<typeof ReText>,
  Theme
>([createVariant({ themeKey: 'textVariants' }), typography, color], ReText)

export const Header = ({ graphs, index, isPanning, title, translation }: HeaderProps) => {
  const theme = useTheme<Theme>()

  const data = useDerivedValue(() => graphs[index.value].data)

  // retrieves price and formats it
  const price = useDerivedValue(() =>
    isPanning.value
      ? interpolate(translation.y.value, [0, HEIGHT], [data.value.highPrice, data.value.lowPrice])
      : data.value.closePrice
  )
  const priceFormatted = useDerivedValue(() => {
    // note. block runs inside a worklet, cannot re-use the existing price formatters as-is
    return `$${round(price.value, 2).toLocaleString('en-US', { currency: 'USD' })}`
  })

  // retrieves percent change and format it
  const percentChange = useDerivedValue(
    () => ((price.value - data.value.openPrice) / data.value.openPrice) * 100
  )
  const percentChangeFormatted = useDerivedValue(() =>
    isNaN(percentChange.value) ? '-' : `${round(percentChange.value, 2)}%`
  )
  const percentChangeLabelStyle = useAnimatedStyle(() => ({
    color: percentChange.value > 0 ? theme.colors.green : theme.colors.red,
  }))

  // retrieves date and formats it
  const header = useDerivedValue(() => {
    if (!isPanning.value) return title

    const unix = interpolate(
      translation.x.value,
      [0, WIDTH],
      [data.value.openDate, data.value.closeDate]
    )

    return new Date(unix * 1000).toLocaleString('en-US', {
      day: 'numeric', // numeric, 2-digit
      year: 'numeric', // numeric, 2-digit
      month: 'short', // numeric, 2-digit, long, short, narrow
      hour: 'numeric', // numeric, 2-digit
      minute: 'numeric', // numeric, 2-digit
    })
  })

  return (
    <Flex centered flex={1} flexDirection="column" gap="xs">
      <StyledReText color="gray200" text={header} variant="h4" />
      <StyledReText color="mainForeground" fontSize={45} text={priceFormatted} />
      <StyledReText style={percentChangeLabelStyle} text={percentChangeFormatted} variant="h3" />
    </Flex>
  )
}
