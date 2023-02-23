import { useTheme } from '@shopify/restyle'
import React from 'react'
import { StyleSheet } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { ImageUri } from 'src/components/images/ImageUri'
import { Box, Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { DappInfo, DappInfoV2 } from 'src/features/walletConnect/types'
import { borderRadii, iconSizes } from 'src/styles/sizing'
import { toSupportedChainId } from 'src/utils/chainId'

export function DappHeaderIcon({
  dapp,
  permitCurrencyInfo,
  showChain = true,
}: {
  dapp: DappInfo | DappInfoV2
  permitCurrencyInfo?: CurrencyInfo | null
  showChain?: boolean
}): JSX.Element {
  if (permitCurrencyInfo) {
    return <CurrencyLogo currencyInfo={permitCurrencyInfo} />
  }

  const chainId = dapp.version === '1' ? toSupportedChainId(dapp.chain_id) : null

  const fallback = <DappIconPlaceholder iconSize={iconSizes.icon40} name={dapp.name} />

  return (
    <Box height={iconSizes.icon40} width={iconSizes.icon40}>
      {dapp.icon ? (
        <ImageUri fallback={fallback} imageStyle={DappIconPlaceholderStyles.icon} uri={dapp.icon} />
      ) : (
        { fallback }
      )}
      {showChain && chainId && (
        <Box bottom={-4} position="absolute" right={-4}>
          <NetworkLogo chainId={chainId} />
        </Box>
      )}
    </Box>
  )
}

export function DappIconPlaceholder({
  name,
  iconSize,
}: {
  name: string
  iconSize: number
}): JSX.Element {
  const theme = useTheme()

  return (
    <Flex
      centered
      row
      backgroundColor="background3"
      borderRadius="roundedFull"
      flex={1}
      height={iconSize}
      width={iconSize}>
      <Text
        color="textSecondary"
        textAlign="center"
        variant={iconSize >= theme.iconSizes.icon40 ? 'subheadLarge' : 'bodySmall'}>
        {name.length > 0 ? name.charAt(0) : ' '}
      </Text>
    </Flex>
  )
}

export const DappIconPlaceholderStyles = StyleSheet.create({
  icon: { borderRadius: borderRadii.rounded20, height: iconSizes.icon40, width: iconSizes.icon40 },
})
