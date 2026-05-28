import { Flex, UniversalImage } from 'ui/src'
import { borderRadii, iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { DappIconPlaceholder } from 'uniswap/src/components/dapps/DappIconPlaceholder'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { DappConnectionInfo } from 'wallet/src/features/dappRequests/types'

export function DappHeaderIcon({
  dappInfo,
  permitCurrencyInfo,
  size = iconSizes.icon40,
}: {
  dappInfo: DappConnectionInfo
  permitCurrencyInfo?: CurrencyInfo | null
  size?: number
}): JSX.Element {
  if (permitCurrencyInfo) {
    return <CurrencyLogo currencyInfo={permitCurrencyInfo} />
  }

  const fallback = <DappIconPlaceholder iconSize={size} name={dappInfo.name} />

  return (
    <Flex height={size} width={size}>
      {dappInfo.icon ? (
        <UniversalImage
          fallback={fallback}
          size={{ height: size, width: size }}
          style={{
            image: { borderRadius: borderRadii.roundedFull },
            loadingContainer: {
              borderRadius: borderRadii.roundedFull,
              overflow: 'hidden',
            },
          }}
          uri={dappInfo.icon}
        />
      ) : (
        fallback
      )}
    </Flex>
  )
}
