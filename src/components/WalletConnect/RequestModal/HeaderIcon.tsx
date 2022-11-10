import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Image } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { DappInfo } from 'src/features/walletConnect/types'
import { iconSizes } from 'src/styles/sizing'
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
  if (permitCurrency) {
    return <CurrencyLogo currency={permitCurrency} />
  }

  const chainId = toSupportedChainId(dapp.chain_id) ?? ChainId.Mainnet
  return (
    <Box>
      {/* TODO: Add placeholder logo here for dapps without icons */}
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
