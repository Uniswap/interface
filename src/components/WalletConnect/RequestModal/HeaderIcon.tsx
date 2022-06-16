import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { Image } from 'react-native'
import { CurrencyLogoOrPlaceholder } from 'src/components/CurrencyLogo/CurrencyLogoOrPlaceholder'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box } from 'src/components/layout'
import { ChainId } from 'src/constants/chains'
import { DappInfo } from 'src/features/walletConnect/types'
import { toSupportedChainId } from 'src/utils/chainId'

const DAPP_IMAGE_SIZE = 48
export function HeaderIcon({
  dapp,
  permitCurrency,
}: {
  dapp: DappInfo
  permitCurrency?: Currency | null
}) {
  if (permitCurrency) {
    return <CurrencyLogoOrPlaceholder currency={permitCurrency} size={DAPP_IMAGE_SIZE} />
  }

  const chainId = toSupportedChainId(dapp.chain_id) ?? ChainId.Mainnet

  return (
    <>
      <Image source={{ uri: dapp.icon, height: DAPP_IMAGE_SIZE, width: DAPP_IMAGE_SIZE }} />
      <Box bottom={-4} position="absolute" right={-4}>
        <NetworkLogo chainId={chainId} size={20} />
      </Box>
    </>
  )
}
