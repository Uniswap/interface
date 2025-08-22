import React from 'react'
import { Flex, UniversalImage } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { DappRequestInfo } from 'uniswap/src/types/walletConnect'

export function DappHeaderIcon({
  dappRequestInfo,
  permitCurrencyInfo,
  size = iconSizes.icon40,
}: {
  dappRequestInfo: DappRequestInfo
  permitCurrencyInfo?: CurrencyInfo | null
  size?: number
}): JSX.Element {
  if (permitCurrencyInfo) {
    return <CurrencyLogo currencyInfo={permitCurrencyInfo} />
  }

  const fallback = <DappIconPlaceholder iconSize={size} name={dappRequestInfo.name} />

  return (
    <Flex height={size} width={size}>
      {dappRequestInfo.icon ? (
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
          uri={dappRequestInfo.icon}
        />
      ) : (
        fallback
      )}
    </Flex>
  )
}
