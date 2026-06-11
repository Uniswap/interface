import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { getIssuerCount } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { TABLE_SUBLINE_HEIGHT, type ExpandableAssetGroupVariant } from 'uniswap/src/features/expandableAsset/types'

export type ExpandableParentAssetIdentityProps = {
  asset: Rwa
  canExpand: boolean
  isExpanded?: boolean
  variant?: ExpandableAssetGroupVariant
  /** Search-only: show the issuer count alongside the symbol on the collapsed subline. */
  showTokenCount?: boolean
}

export function ExpandableParentAssetIdentity({
  asset,
  canExpand,
  isExpanded,
  variant = 'table',
  showTokenCount = false,
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

  // Search no-query collapsed subline: symbol then "<count> tokens" in a 4px-gap row, no separator (e.g.
  // "TSLA 3 tokens"). Single-line: the symbol shrinks/truncates, the count stays intact.
  const symbolWithCountSubline = (
    <Flex row gap="$spacing4" minWidth={0}>
      <Text variant="body3" color="$neutral2" numberOfLines={1} flexShrink={1}>
        {asset.symbol}
      </Text>
      <Text variant="body3" color="$neutral3" numberOfLines={1} flexShrink={0}>
        {t('explore.rwa.issuerTokenCount', { count: issuerCount })}
      </Text>
    </Flex>
  )

  // Collapsed subline for the search variant: count next to symbol only when explicitly requested.
  const searchCollapsedSubline = showTokenCount && canExpand ? symbolWithCountSubline : symbolSubline

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
        {variant === 'search' ? asset.symbol : t('explore.rwa.issuerTokenCount', { count: issuerCount })}
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
        {canExpand ? (
          isExpanded ? (
            expandedSubline
          ) : variant === 'table' ? (
            <GroupHoverTransition
              showTransition
              height={TABLE_SUBLINE_HEIGHT}
              defaultContent={symbolSubline}
              hoverContent={tokenCountSubline}
            />
          ) : (
            searchCollapsedSubline
          )
        ) : (
          symbolSubline
        )}
      </Flex>
    </Flex>
  )
}
