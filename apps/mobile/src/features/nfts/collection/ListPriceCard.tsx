import { BlurView } from 'expo-blur'
import React from 'react'
import { StyleSheet } from 'react-native'
import { IS_IOS } from 'src/constants/globals'
import { ColorTokens, Flex, FlexProps, Logos, SpaceTokens, Text, useSporeColors } from 'ui/src'
import { iconSizes, TextVariantTokens } from 'ui/src/theme'
import { theme as FixedTheme } from 'ui/src/theme/restyle'
import { formatNumber, NumberType } from 'utilities/src/format/format'
import { Amount } from 'wallet/src/data/__generated__/types-and-hooks'

type ListPriceProps = FlexProps & {
  price: Amount
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
      {IS_IOS ? (
        <BlurView intensity={50} style={styles.background} tint="dark">
          <PriceAmount {...priceAmountProps} />
        </BlurView>
      ) : (
        <Flex style={[styles.background, { backgroundColor: colors.surface2.val }]}>
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
  textVariant = 'buttonLabelMicro',
  iconColor = '$neutral1',
  textColor = '$neutral1',
}: ListPriceProps): JSX.Element {
  const isUSD = price.currency === 'USD'
  const formattedAmount = isUSD
    ? formatNumber(price.value, NumberType.FiatTokenPrice)
    : formatNumber(price.value, NumberType.NFTTokenFloorPrice)

  return (
    <Flex centered row gap={gap} overflow="hidden">
      {!isUSD && (
        <Logos.Ethereum color={iconColor || '$neutral1'} height={iconSize} width={iconSize} />
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
    paddingHorizontal: FixedTheme.spacing.spacing8,
    paddingVertical: FixedTheme.spacing.spacing2,
  },
  blurWrapper: {
    borderRadius: FixedTheme.borderRadii.rounded16,
    overflow: 'hidden',
  },
})
