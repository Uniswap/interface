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

export function HeaderIcon({
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

  const fallback = <HeaderIconPlaceholder name={dapp.name} />

  return (
    <Box>
      {dapp.icon ? (
        <ImageUri fallback={fallback} imageStyle={styles.icon} uri={dapp.icon} />
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

function HeaderIconPlaceholder({ name }: { name: string }): JSX.Element {
  return (
    <Flex
      centered
      row
      backgroundColor="background3"
      borderRadius="roundedFull"
      flex={1}
      height={iconSizes.icon40}
      width={iconSizes.icon40}>
      <Text color="textSecondary" textAlign="center" variant="subheadLarge">
        {name.length > 0 ? name.charAt(0) : ' '}
      </Text>
    </Flex>
  )
}

const styles = StyleSheet.create({
  icon: { borderRadius: borderRadii.rounded20, height: iconSizes.icon40, width: iconSizes.icon40 },
})
