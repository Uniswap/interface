import type { UniverseChainId } from '@universe/chains'
import { isHoverable } from '@universe/environment'
import { Flex, iconSizes, Text } from '@universe/mycelium'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { pickFilteredChainToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/pickPrimaryChainToken'
import { getIssuerCount, getRwaNetworkCount } from 'uniswap/src/data/apiClients/dataApiService/rwa/rwaMetrics'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { TABLE_SUBLINE_HEIGHT, type ExpandableAssetGroupVariant } from 'uniswap/src/features/expandableAsset/types'

export type ExpandableParentAssetIdentityProps = {
  asset: Rwa
  enabledChainIds: readonly UniverseChainId[]
  canExpand: boolean
  isExpanded?: boolean
  variant?: ExpandableAssetGroupVariant
  chainFilter?: UniverseChainId
  categoryTag?: ReactNode
  showNetworkCount?: boolean
  volumeDetail?: string
  inlineChevron?: boolean
}

export function ExpandableParentAssetIdentity({
  asset,
  enabledChainIds,
  canExpand,
  isExpanded,
  variant = 'table',
  chainFilter,
  categoryTag,
  showNetworkCount = false,
  volumeDetail,
  inlineChevron = true,
}: ExpandableParentAssetIdentityProps): JSX.Element {
  const { t } = useTranslation()
  const issuerCount = getIssuerCount(asset)
  const badgeChainId = asset.issuerTokens.some((issuer) =>
    pickFilteredChainToken({ chainTokens: issuer.chainTokens, enabledChainIds, chainFilter }),
  )
    ? chainFilter
    : undefined
  const issuerCountLabel = t('explore.rwa.issuerTokenCount', { count: issuerCount })
  const expandableSublineLabel = showNetworkCount
    ? t('explore.tokens.table.networks', { count: getRwaNetworkCount(asset, enabledChainIds) })
    : issuerCountLabel
  const logoSize = variant === 'search' ? iconSizes.icon40 : iconSizes.icon32
  const sublineHeight = variant === 'table' ? TABLE_SUBLINE_HEIGHT : undefined

  // Search keeps the collapsed chevron always visible: its right slot holds the stats.
  const chevron = isExpanded ? (
    <ChevronsIn color="$neutral2" size="$icon.16" />
  ) : variant === 'table' ? (
    <ChevronsOut
      color="$neutral2"
      opacity={isHoverable ? 0 : 1}
      size="$icon.16"
      transition={isHoverable ? 'opacity 120ms ease-in-out' : undefined}
      $group-hover={isHoverable ? { opacity: 1 } : undefined}
    />
  ) : (
    <ChevronsOut color="$neutral2" size="$icon.16" />
  )

  const expandableSubline = (
    <Flex row alignItems="center" gap={variant === 'search' ? '$spacing2' : '$spacing4'} height={sublineHeight}>
      <Text variant="body3" color="$neutral2" numberOfLines={1}>
        {expandableSublineLabel}
      </Text>
      {variant === 'table' || inlineChevron ? chevron : null}
    </Flex>
  )

  const searchSubline = (
    <Flex row alignItems="center" gap="$spacing8" minWidth={0}>
      {expandableSubline}
      {volumeDetail && !isExpanded && (
        <Text variant="body3" color="$neutral3" numberOfLines={1}>
          {volumeDetail}
        </Text>
      )}
    </Flex>
  )

  const subline =
    variant === 'table' ? (
      canExpand ? (
        expandableSubline
      ) : (
        <Text variant="body3" color="$neutral2" numberOfLines={1} height={sublineHeight}>
          {issuerCountLabel}
        </Text>
      )
    ) : canExpand ? (
      searchSubline
    ) : (
      <Text variant="body3" color="$neutral2" numberOfLines={1}>
        {asset.symbol}
      </Text>
    )

  return (
    <Flex row gap="$spacing12" alignItems="center" width="100%" minWidth={0}>
      <TokenLogo
        url={asset.logoUrl}
        symbol={asset.symbol}
        name={asset.name}
        chainId={badgeChainId}
        size={logoSize}
        alwaysShowNetworkLogo={Boolean(badgeChainId)}
        hideNetworkLogo={!badgeChainId}
      />
      <Flex flex={1} minWidth={0} gap={variant === 'search' ? '$spacing2' : undefined}>
        {/* Baseline like OptionItem's title row, so the pill sits identically on every row. */}
        <Flex row alignItems="baseline" gap="$spacing6" minWidth={0}>
          <Text variant={variant === 'search' ? 'body1' : 'body2'} color="$neutral1" numberOfLines={1} flexShrink={1}>
            {asset.name}
          </Text>
          {categoryTag}
        </Flex>
        {subline}
      </Flex>
    </Flex>
  )
}
