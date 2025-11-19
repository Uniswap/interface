import type { ReactNode } from 'react'
import type { ColorTokens, IconProps } from 'ui/src'
import { Flex, Text } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { AssetLogo } from 'wallet/src/components/dappRequests/AssetLogo'
import type { TransactionAsset } from 'wallet/src/features/dappRequests/types'

interface TransactionAssetListProps {
  assets: TransactionAsset[]
  icon: React.ComponentType<IconProps>
  iconColor: ColorTokens
  titleText: string
  formatAmount?: (asset: TransactionAsset) => string
  showUsdValue?: boolean
}

/**
 * Shared component for rendering transaction asset lists with conditional layout:
 * - Single item: Icon and title inline with asset details
 * - Multiple items: Icon and title as header, then list of assets
 */
export function TransactionAssetList({
  assets,
  icon: Icon,
  iconColor,
  titleText,
  formatAmount,
  showUsdValue = false,
}: TransactionAssetListProps): JSX.Element | null {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  const renderAssetDetails = (asset: TransactionAsset): ReactNode => {
    const amountText = formatAmount ? formatAmount(asset) : `${asset.amount ?? ''} ${asset.symbol ?? ''}`

    return (
      <Flex row gap="$spacing8" alignItems="center">
        <Text color="$neutral1" variant="subheading1">
          {amountText}
        </Text>
        {showUsdValue && asset.usdValue && (
          <Text color="$neutral2" variant="body4">
            ({convertFiatAmountFormatted(asset.usdValue, NumberType.FiatTokenPrice)})
          </Text>
        )}
      </Flex>
    )
  }

  // Single item layout: icon and title inline with content
  if (assets.length === 1) {
    const asset = assets[0]
    if (!asset) {
      return null
    }
    return (
      <Flex gap="$spacing12">
        <Flex row gap="$spacing12" alignItems="center" justifyContent="space-between">
          <Flex flex={1} gap="$spacing4">
            <Flex row gap="$spacing8" height={20} alignItems="center">
              <Icon color={iconColor} size="$icon.12" />
              <Text color="$neutral2" variant="body3">
                {titleText}
              </Text>
            </Flex>
            {renderAssetDetails(asset)}
          </Flex>
          <AssetLogo logoUrl={asset.logoUrl} />
        </Flex>
      </Flex>
    )
  }

  // Multiple items layout: header row, then list of items
  return (
    <Flex gap="$spacing4">
      <Flex row gap="$spacing8" height="$spacing20" alignItems="center">
        <Icon color={iconColor} size="$icon.12" />
        <Text color="$neutral2" variant="body3">
          {titleText}
        </Text>
      </Flex>
      <Flex gap="$spacing8">
        {assets.map((asset) => {
          return (
            <Flex key={asset.address} row alignItems="center" justifyContent="space-between">
              <Flex row gap="$spacing4" alignItems="center" flex={1}>
                {renderAssetDetails(asset)}
              </Flex>
              <AssetLogo logoUrl={asset.logoUrl} />
            </Flex>
          )
        })}
      </Flex>
    </Flex>
  )
}
