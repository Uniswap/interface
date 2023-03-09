import { BlurView } from 'expo-blur'
import React from 'react'
import { StyleSheet } from 'react-native'
import EthereumLogo from 'src/assets/logos/ethereum.svg'
import { Box, BoxProps, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { Amount } from 'src/data/__generated__/types-and-hooks'
import { theme } from 'src/styles/theme'
import { formatNumber, NumberType } from 'src/utils/format'

const BLUR_INTENSITY = 35

interface ListPriceProps {
  price: Amount
}

export function ListPriceCard({ price, ...rest }: ListPriceProps & BoxProps): JSX.Element {
  const isUSD = price.currency === 'USD'
  const formattedAmount = isUSD
    ? formatNumber(price.value, NumberType.FiatTokenPrice)
    : formatNumber(price.value, NumberType.NFTTokenFloorPrice)

  return (
    <Box alignItems="center" {...rest}>
      <BlurView intensity={BLUR_INTENSITY} style={Styles.blurView} tint="dark">
        <Flex centered row gap="none" overflow="hidden">
          {!isUSD && (
            <EthereumLogo
              color="white"
              height={theme.iconSizes.icon12}
              width={theme.iconSizes.icon12}
            />
          )}
          <Text color="white" variant="buttonLabelMicro">
            {formattedAmount}
          </Text>
        </Flex>
      </BlurView>
    </Box>
  )
}

const Styles = StyleSheet.create({
  blurView: {
    borderRadius: theme.borderRadii.rounded16,
    overflow: 'hidden',
    paddingHorizontal: theme.spacing.spacing8,
    paddingVertical: theme.spacing.spacing2,
  },
})
