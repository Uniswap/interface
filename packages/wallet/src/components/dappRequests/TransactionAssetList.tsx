import type { ReactNode } from 'react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { ColorTokens, IconProps } from 'ui/src'
import { Flex, Popover, Text, TouchableArea, useSporeColors } from 'ui/src'
import { ExternalLink, InfoCircleFilled } from 'ui/src/components/icons'
import { borderRadii, iconSizes } from 'ui/src/theme'
import type { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ExplorerDataType, getExplorerLink, openUri } from 'uniswap/src/utils/linking'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { AssetLogo } from 'wallet/src/components/dappRequests/AssetLogo'
import type { GroupedApprovalAsset } from 'wallet/src/components/dappRequests/TransactionApprovingSection'
import type { TransactionAsset } from 'wallet/src/features/dappRequests/types'

/**
 * Popover component showing approval details for multiple addresses
 */
interface ApprovalAddressesPopoverProps {
  assets: TransactionAsset[]
  formatAmount: (asset: TransactionAsset) => string
}

function ApprovalAddressesPopover({ assets, formatAmount }: ApprovalAddressesPopoverProps): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const colors = useSporeColors()

  const handleOpenExplorer = async (spenderAddress: string, chainId: number): Promise<void> => {
    const explorerUrl = getExplorerLink({
      chainId,
      data: spenderAddress,
      type: ExplorerDataType.ADDRESS,
    })
    await openUri({ uri: explorerUrl }).catch(() => {
      logger.error(new Error('Failed to open explorer'), {
        tags: { file: 'TransactionAssetList', function: 'handleOpenExplorer' },
        extra: { explorerUrl },
      })
    })
  }

  return (
    <Popover open={isOpen} placement="bottom-start" onOpenChange={setIsOpen}>
      <Flex row gap="$spacing4" alignItems="center">
        <Popover.Trigger asChild>
          <Flex row gap="$spacing4" alignItems="center">
            <TouchableArea onPress={() => setIsOpen(true)}>
              <InfoCircleFilled color="$neutral3" size={iconSizes.icon16} />
            </TouchableArea>
            <Text color="$neutral2" variant="body4">
              {t('common.addresses.count', { count: assets.length })}
            </Text>
          </Flex>
        </Popover.Trigger>
      </Flex>

      <Popover.Content
        elevate
        borderRadius="$rounded12"
        borderWidth={1}
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing12"
        gap="$spacing4"
      >
        {assets
          .filter((asset): asset is TransactionAsset & { spenderAddress: string } => Boolean(asset.spenderAddress))
          .map((asset, index) => {
            const { spenderAddress } = asset

            return (
              <Flex
                key={`${spenderAddress}-${index}`}
                grow
                row
                justifyContent="space-between"
                alignItems="center"
                gap="$spacing8"
              >
                <Text color="$neutral1" variant="body4" flexGrow={1}>
                  {formatAmount(asset)}
                </Text>
                <Flex row gap="$spacing4" alignItems="center">
                  <Text color="$neutral2" variant="body4">
                    {shortenAddress({ address: spenderAddress })}
                  </Text>
                  <TouchableArea
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => handleOpenExplorer(spenderAddress, asset.chainId)}
                  >
                    <ExternalLink color="$neutral2" size={iconSizes.icon16} />
                  </TouchableArea>
                </Flex>
              </Flex>
            )
          })}
        <Popover.Arrow
          size="$spacing12"
          backgroundColor={colors.surface1.val}
          borderWidth={1}
          borderColor={colors.surface3.val}
        />
      </Popover.Content>
    </Popover>
  )
}

/**
 * Helper function to format asset amount with locale-specific number formatting
 * @param asset - The transaction asset to format
 * @param formatNumberOrString - Locale formatter function
 * @returns Formatted amount with symbol
 */
function formatAmountWithLocale(
  asset: TransactionAsset,
  formatNumberOrString: LocalizationContextState['formatNumberOrString'],
): string {
  if (!asset.amount) {
    return asset.symbol ?? asset.name ?? ''
  }

  const formattedAmount = formatNumberOrString({
    value: asset.amount,
    type: NumberType.TokenNonTx,
  })

  return `${formattedAmount} ${asset.symbol ?? ''}`
}

const getBorderRadius = (type: TransactionAsset['type']): number => {
  if (type === 'ERC20' || type === 'NATIVE') {
    return borderRadii.roundedFull
  }
  return borderRadii.rounded12
}

interface TransactionAssetListProps {
  assets: TransactionAsset[]
  icon: React.ComponentType<IconProps>
  iconColor: ColorTokens
  titleText: string
  formatAmount?: (asset: TransactionAsset) => string
  showUsdValue?: boolean
  groupedAssets?: GroupedApprovalAsset[]
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
  groupedAssets,
}: TransactionAssetListProps): JSX.Element | null {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const renderAssetDetails = (asset: TransactionAsset, groupedAsset?: GroupedApprovalAsset): ReactNode => {
    const amountText = formatAmount ? formatAmount(asset) : formatAmountWithLocale(asset, formatNumberOrString)
    const hasMultipleAddresses = groupedAsset && groupedAsset.allAssets.length > 1

    return (
      <Flex gap="$spacing4">
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
        {hasMultipleAddresses && formatAmount && (
          <ApprovalAddressesPopover assets={groupedAsset.allAssets} formatAmount={formatAmount} />
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
    const groupedAsset = groupedAssets?.[0]
    return (
      <Flex gap="$spacing12">
        <Flex row gap="$spacing12" alignItems="center" justifyContent="space-between">
          <Flex flex={1} gap="$spacing4">
            <Flex row gap="$spacing8" height={20} alignItems="center">
              <Icon color={iconColor} size="$icon.16" />
              <Text color="$neutral2" variant="body3">
                {titleText}
              </Text>
            </Flex>
            {renderAssetDetails(asset, groupedAsset)}
          </Flex>
          <AssetLogo
            address={asset.address}
            chainId={asset.chainId}
            logoUrl={asset.logoUrl}
            borderRadius={getBorderRadius(asset.type)}
          />
        </Flex>
      </Flex>
    )
  }

  // Multiple items layout: header row, then list of items
  return (
    <Flex gap="$spacing4">
      <Flex row gap="$spacing8" height="$spacing20" alignItems="center">
        <Icon color={iconColor} size="$icon.16" />
        <Text color="$neutral2" variant="body3">
          {titleText}
        </Text>
      </Flex>
      <Flex gap="$spacing8">
        {assets.map((asset, index) => {
          const groupedAsset = groupedAssets?.[index]
          return (
            <Flex key={`${asset.address}-${index}`} row alignItems="center" justifyContent="space-between">
              <Flex row gap="$spacing4" alignItems="center" flex={1}>
                {renderAssetDetails(asset, groupedAsset)}
              </Flex>
              <AssetLogo
                address={asset.address}
                chainId={asset.chainId}
                logoUrl={asset.logoUrl}
                borderRadius={getBorderRadius(asset.type)}
              />
            </Flex>
          )
        })}
      </Flex>
    </Flex>
  )
}
