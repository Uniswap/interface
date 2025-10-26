import { GraphQLApi } from '@universe/api'
import { BlurView } from 'expo-blur'
import React from 'react'
import { StyleSheet } from 'react-native'
import { ColorTokens, Flex, FlexProps, SpaceTokens, Text, useSporeColors } from 'ui/src'
import { Ethereum } from 'ui/src/components/logos/Ethereum'
import { borderRadii, iconSizes, spacing, TextVariantTokens } from 'ui/src/theme'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { isIOS } from 'utilities/src/platform'

type ListPriceProps = FlexProps & {
  price: GraphQLApi.IAmount
  gap?: SpaceTokens
  iconSize?: number
  textVariant?: TextVariantTokens
  iconColor?: ColorTokens
  textColor?: ColorTokens
}

export function ListPriceBadge({
  iconColor,
  textColor,
  iconSize,
  price,
  gap,
  ...flexProps
}: ListPriceProps): JSX.Element {
  const colors = useSporeColors()
  const priceAmountProps = { iconColor, textColor, iconSize, price, gap }

  return (
    <Flex alignItems="center" style={styles.blurWrapper} {...flexProps}>
      {isIOS ? (
        <BlurView intensity={50} style={styles.background} tint="dark">
          <PriceAmount {...priceAmountProps} />
        </BlurView>
      ) : (
        <Flex style={[styles.background, { backgroundColor: colors.surface2.get() }]}>
          <PriceAmount {...priceAmountProps} />
        </Flex>
      )}
    </Flex>
  )
}

export function PriceAmount({
  price,
  gap = '$spacing4',
  iconSize = iconSizes.icon16,
  textVariant = 'buttonLabel2',
  iconColor = '$neutral1',
  textColor = '$neutral1',
}: ListPriceProps): JSX.Element {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const isUSD = price.currency === 'USD'
  const formattedFiatValue = convertFiatAmountFormatted(price.value, NumberType.FiatTokenPrice)
  const formattedAmount = isUSD
    ? formattedFiatValue
    : formatNumberOrString({ value: price.value, type: NumberType.NFTTokenFloorPrice })

  return (
    <Flex centered row gap={gap} overflow="hidden">
      {!isUSD && (
        // @ts-expect-error TODO(MOB-1566) convert to specific icon size token, avoiding doing too big of a change in this PR
        <Ethereum color={iconColor} height={iconSize} width={iconSize} />
      )}
      <Text color={textColor} variant={textVariant}>
        {formattedAmount}
      </Text>
    </Flex>
  )
}

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.spacing8,
    paddingVertical: spacing.spacing2,
  },
  blurWrapper: {
    borderRadius: borderRadii.rounded16,
    overflow: 'hidden',
  },
})
