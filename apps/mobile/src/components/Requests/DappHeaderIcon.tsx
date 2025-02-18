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
  size = iconSizes.icon40,
}: {
  dapp: DappInfo
  permitCurrencyInfo?: CurrencyInfo | null
  size?: number
}): JSX.Element {
  if (permitCurrencyInfo) {
    return <CurrencyLogo currencyInfo={permitCurrencyInfo} />
  }

  const fallback = <DappIconPlaceholder iconSize={size} name={dapp.name} />

  return (
    <Flex height={size} width={size}>
      {dapp.icon ? (
        <UniversalImage
          fallback={fallback}
          size={{ height: size, width: size }}
          style={{
            image: { borderRadius: borderRadii.rounded8 },
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
