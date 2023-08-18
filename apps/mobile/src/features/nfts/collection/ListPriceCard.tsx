import { BlurView } from '@react-native-community/blur'
import React from 'react'
import { StyleSheet } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { Box, BoxProps, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Logos } from 'ui/src'
import { theme as FixedTheme, Theme } from 'ui/src/theme/restyle'
import { formatNumber, NumberType } from 'utilities/src/format/format'
import { Amount } from 'wallet/src/data/__generated__/types-and-hooks'

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
    <Box alignItems="center" style={styles.blurWrapper} {...props}>
      <BlurView blurAmount={20} blurType="light" reducedTransparencyFallbackColor="black">
        <Box style={styles.blurView}>
          <Flex
            bg="sporeBlack"
            bottom={0}
            left={0}
            opacity={0.25}
            position="absolute"
            right={0}
            top={0}
          />
          <PriceAmount {...props} />
        </Box>
      </BlurView>
    </Box>
  )
}

export function PriceAmount({
  price,
  gap = 'spacing4',
  iconSize = 'icon16',
  iconColor,
  textColor = 'neutral1',
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
        <Logos.Ethereum
          color={theme.colors[iconColor || 'neutral1']}
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

const styles = StyleSheet.create({
  blurView: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingHorizontal: FixedTheme.spacing.spacing8,
    paddingVertical: FixedTheme.spacing.spacing2,
  },
  blurWrapper: {
    borderRadius: FixedTheme.borderRadii.rounded16,
    overflow: 'hidden',
  },
})
