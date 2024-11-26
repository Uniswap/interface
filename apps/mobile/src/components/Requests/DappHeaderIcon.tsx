import React from 'react'
import { Flex, UniversalImage } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { DappInfo } from 'uniswap/src/types/walletConnect'
import { DappIconPlaceholder } from 'wallet/src/components/WalletConnect/DappIconPlaceholder'

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
        <UniversalImage
          fallback={fallback}
          size={{ height: iconSizes.icon40, width: iconSizes.icon40 }}
          style={{
            image: { borderRadius: borderRadii.rounded4 },
            loadingContainer: {
              borderRadius: borderRadii.roundedFull,
              overflow: 'hidden',
            },
          }}
          uri={dapp.icon}
        />
      ) : (
        fallback
      )}
    </Flex>
  )
}
