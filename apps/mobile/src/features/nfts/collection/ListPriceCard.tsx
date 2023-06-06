import { BlurView } from 'expo-blur'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box, BoxProps, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import EthereumLogo from 'ui/src/assets/logos/ethereum.svg'
import { theme as FixedTheme, Theme } from 'ui/src/theme/restyle/theme'
import { Amount } from 'wallet/src/data/__generated__/types-and-hooks'
import { formatNumber, NumberType } from 'wallet/src/utils/format'

const BLUR_INTENSITY = 35

interface ListPriceProps extends BoxProps {
  price: Amount
  gap?: keyof Theme['spacing']
  iconSize?: keyof Theme['iconSizes']
  iconColor?: keyof Theme['colors']
  textColor?: keyof Theme['colors']
  textVariant?: keyof Theme['textVariants']
}

export function ListPriceBadge(props: ListPriceProps): JSX.Element {
  return (
    <Box alignItems="center" {...props}>
      <BlurView intensity={BLUR_INTENSITY} style={Styles.blurView} tint="dark">
        <PriceAmount {...props} />
      </BlurView>
    </Box>
  )
}

export function PriceAmount({
  price,
  gap = 'spacing4',
  iconSize = 'icon16',
  iconColor,
  textColor = 'textPrimary',
  textVariant = 'buttonLabelMicro',
}: ListPriceProps): JSX.Element {
  const theme = useAppTheme()
  const isUSD = price.currency === 'USD'
  const formattedAmount = isUSD
    ? formatNumber(price.value, NumberType.FiatTokenPrice)
    : formatNumber(price.value, NumberType.NFTTokenFloorPrice)
  return (
    <Flex centered row gap={gap} overflow="hidden">
      {!isUSD && (
        <EthereumLogo
          color={theme.colors[iconColor || 'textPrimary']}
          height={theme.iconSizes[iconSize]}
          width={theme.iconSizes[iconSize]}
        />
      )}
      <Text color={textColor} variant={textVariant}>
        {formattedAmount}
      </Text>
    </Flex>
  )
}

const Styles = StyleSheet.create({
  blurView: {
    borderRadius: FixedTheme.borderRadii.rounded16,
    overflow: 'hidden',
    paddingHorizontal: FixedTheme.spacing.spacing8,
    paddingVertical: FixedTheme.spacing.spacing2,
  },
})
