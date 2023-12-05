import React from 'react'
import { StyleSheet } from 'react-native'
import { Flex } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { ImageUri } from 'wallet/src/features/images/ImageUri'
import { DappInfo } from 'wallet/src/features/walletConnect/types'

export function DappHeaderIcon({
  dapp,
  permitCurrencyInfo,
}: {
  dapp: DappInfo
  permitCurrencyInfo?: CurrencyInfo | null
}): JSX.Element {
  if (permitCurrencyInfo) {
    return <CurrencyLogo currencyInfo={permitCurrencyInfo} />
  }

  const fallback = <DappIconPlaceholder iconSize={iconSizes.icon40} name={dapp.name} />

  return (
    <Flex height={iconSizes.icon40} width={iconSizes.icon40}>
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
    </Flex>
  )
}

const DappIconPlaceholderStyles = StyleSheet.create({
  icon: { borderRadius: borderRadii.rounded4, height: iconSizes.icon40, width: iconSizes.icon40 },
  loading: { borderRadius: borderRadii.roundedFull, overflow: 'hidden' },
})
