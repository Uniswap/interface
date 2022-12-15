import React from 'react'
import { Image } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { DappInfo } from 'src/features/walletConnect/types'
import { iconSizes } from 'src/styles/sizing'
import { toSupportedChainId } from 'src/utils/chainId'

export function HeaderIcon({
  dapp,
  permitCurrencyInfo,
  showChain = true,
}: {
  dapp: DappInfo
  permitCurrencyInfo?: CurrencyInfo | null
  showChain?: boolean
}) {
  if (permitCurrencyInfo) {
    return <CurrencyLogo currencyInfo={permitCurrencyInfo} />
  }

  const chainId = toSupportedChainId(dapp.chain_id) ?? ChainId.Mainnet
  return (
    <Box>
      {/* TODO: [MOB-3880] Add placeholder logo here for dapps without icons */}
      {dapp.icon ? (
        <Image source={{ uri: dapp.icon, height: iconSizes.xxxl, width: iconSizes.xxxl }} />
      ) : null}
      {showChain && (
        <Box bottom={-4} position="absolute" right={-4}>
          <NetworkLogo chainId={chainId} />
        </Box>
      )}
    </Box>
  )
}
