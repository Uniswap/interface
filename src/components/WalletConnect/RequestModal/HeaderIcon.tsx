import React from 'react'
import { Image } from 'react-native'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { NetworkLogo } from 'src/components/CurrencyLogo/NetworkLogo'
import { Box } from 'src/components/layout'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { DappInfo, DappInfoV2 } from 'src/features/walletConnect/types'
import { iconSizes } from 'src/styles/sizing'
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

  return (
    <Box>
      {/* TODO: [MOB-3880] Add placeholder logo here for dapps without icons */}
      {dapp.icon ? (
        <Image source={{ uri: dapp.icon, height: iconSizes.icon40, width: iconSizes.icon40 }} />
      ) : null}
      {showChain && chainId && (
        <Box bottom={-4} position="absolute" right={-4}>
          <NetworkLogo chainId={chainId} />
        </Box>
      )}
    </Box>
  )
}
