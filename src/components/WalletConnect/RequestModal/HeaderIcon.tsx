import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Image } from 'react-native'
import { useAppTheme } from 'src/app/hooks'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { DappInfo } from 'src/features/walletConnect/types'
import { toSupportedChainId } from 'src/utils/chainId'

export function HeaderIcon({
  dapp,
  permitCurrency,
  showChain = true,
}: {
  dapp: DappInfo
  permitCurrency?: Currency | null
  showChain?: boolean
}) {
  const theme = useAppTheme()
  if (permitCurrency) {
    return <CurrencyLogoOrPlaceholder currency={permitCurrency} size={theme.imageSizes.xxl} />
  }

  const chainId = toSupportedChainId(dapp.chain_id) ?? ChainId.Mainnet

  return (
    <Box>
      {/* TODO: Add placeholder logo here for dapps without icons */}
      {dapp.icon ? (
        <Image
          source={{ uri: dapp.icon, height: theme.imageSizes.xxl, width: theme.imageSizes.xxl }}
        />
      ) : null}
      {showChain && (
        <Box bottom={-4} position="absolute" right={-4}>
          <NetworkLogo chainId={chainId} size={20} />
        </Box>
      )}
    </Box>
  )
}
