import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { getIssuerCount } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { TABLE_SUBLINE_HEIGHT, type ExpandableAssetGroupVariant } from 'uniswap/src/features/expandableAsset/types'

export type ExpandableParentAssetIdentityProps = {
  asset: Rwa
  canExpand: boolean
  isExpanded?: boolean
  variant?: ExpandableAssetGroupVariant
}

export function ExpandableParentAssetIdentity({
  asset,
  canExpand,
  isExpanded,
  variant = 'table',
}: ExpandableParentAssetIdentityProps): JSX.Element {
  const { t } = useTranslation()
  const issuerCount = getIssuerCount(asset)
  const logoSize = variant === 'search' ? iconSizes.icon40 : iconSizes.icon32
  const sublineHeight = variant === 'table' ? TABLE_SUBLINE_HEIGHT : undefined

  const symbolSubline = (
    <Text variant="body3" color="$neutral2" numberOfLines={1} height={sublineHeight}>
      {asset.symbol}
    </Text>
  )

  // Issuer-count subline ("3 tokens"). Chevron is table-only — the search row draws its own in ExpandableAssetGroup.
  const tokenCountSubline = (
    <Flex row alignItems="center" gap="$spacing4" height={sublineHeight}>
      <Text variant="body3" color="$neutral2" numberOfLines={1}>
        {t('explore.rwa.issuerTokenCount', { count: issuerCount })}
      </Text>
      {variant === 'table' && <ChevronsOut color="$neutral2" size="$icon.16" />}
    </Flex>
  )

  const expandedSubline = (
    <Flex row alignItems="center" gap="$spacing4" height={sublineHeight}>
      <Text variant="body3" color="$neutral2" numberOfLines={1}>
        {t('explore.rwa.issuerTokenCount', { count: issuerCount })}
      </Text>
      {variant === 'table' && <ChevronsIn color="$neutral2" size="$icon.16" />}
    </Flex>
  )

  return (
    <Flex row gap="$spacing12" alignItems="center" width="100%" minWidth={0}>
      <TokenLogo url={asset.logoUrl} symbol={asset.symbol} name={asset.name} size={logoSize} />
      <Flex flex={1} minWidth={0}>
        <Flex row alignItems="center" gap="$spacing4" minWidth={0}>
          <Text variant={variant === 'search' ? 'body1' : 'body2'} color="$neutral1" numberOfLines={1} flexShrink={1}>
            {asset.name}
          </Text>
        </Flex>
        {!canExpand ? (
          variant === 'table' ? (
            <Text variant="body3" color="$neutral2" numberOfLines={1} height={sublineHeight}>
              {t('explore.rwa.issuerTokenCount', { count: issuerCount })}
            </Text>
          ) : (
            symbolSubline
          )
        ) : variant === 'table' ? (
          isExpanded ? (
            expandedSubline
          ) : (
            tokenCountSubline
          )
        ) : (
          // Search shows the same "{count} tokens" subline whether collapsed or expanded.
          tokenCountSubline
        )}
      </Flex>
    </Flex>
  )
}
