import React from 'react'
import { StyleSheet } from 'react-native'
import { Box } from 'src/components/layout'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { NetworkLogo } from 'wallet/src/components/CurrencyLogo/NetworkLogo'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { toSupportedChainId } from 'wallet/src/features/chains/utils'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { DappInfo } from 'wallet/src/features/walletConnect/types'

export function DappHeaderIcon({
  dapp,
  permitCurrencyInfo,
  showChain = true,
}: {
  dapp: DappInfo
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
        <ImageUri
          fallback={fallback}
          imageStyle={DappIconPlaceholderStyles.icon}
          loadingContainerStyle={{
            ...DappIconPlaceholderStyles.icon,
            ...DappIconPlaceholderStyles.loading,
          }}
          uri={dapp.icon}
        />
      ) : (
        fallback
      )}
      {showChain && chainId && (
        <Box bottom={-4} position="absolute" right={-4}>
          <NetworkLogo chainId={chainId} />
        </Box>
      )}
    </Box>
  )
}

const DappIconPlaceholderStyles = StyleSheet.create({
  icon: { borderRadius: borderRadii.rounded4, height: iconSizes.icon40, width: iconSizes.icon40 },
  loading: { borderRadius: borderRadii.roundedFull, overflow: 'hidden' },
})
