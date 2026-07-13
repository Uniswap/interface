import { useContext } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { formatIssuerDisplaySymbol, formatIssuerLabel } from 'uniswap/src/data/rest/rwa/formatIssuerDisplaySymbol'
import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import { getNetworkCount } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { IssuerToken, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { IssuerTableRowHoverContext } from 'uniswap/src/features/expandableAsset/IssuerTableRowHoverContext'
import { TABLE_SUBLINE_HEIGHT, type ExpandableAssetGroupVariant } from 'uniswap/src/features/expandableAsset/types'
import { shortenAddress } from 'utilities/src/addresses'

export type ExpandableIssuerIdentityProps = {
  asset: Rwa
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
  variant?: ExpandableAssetGroupVariant
  /** When true (Explore network filter active), multichain issuers show a network badge on the logo. */
  hasNetworkFilter?: boolean
  /** Flat single-issuer table row: show issuer token name instead of grouped asset name. */
  useIssuerNameAsPrimary?: boolean
}

export function ExpandableIssuerIdentity({
  asset,
  issuer,
  enabledChainIds,
  variant = 'table',
  hasNetworkFilter = false,
  useIssuerNameAsPrimary = false,
}: ExpandableIssuerIdentityProps): JSX.Element {
  const { t } = useTranslation()
  const issuerTableRowHovered = useContext(IssuerTableRowHoverContext)
  const displaySymbol = formatIssuerDisplaySymbol({
    baseSymbol: asset.symbol,
    apiSymbol: issuer.symbol,
  })
  const chainIds = issuer.chainTokens.map((chain) => chain.chainId as UniverseChainId)
  const networkCount = getNetworkCount(issuer)
  const primaryChain = pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
  // Multichain issuers omit the logo badge unless a network filter is active (matches Explore tokens table).
  const showNetworkBadge = Boolean(primaryChain) && (chainIds.length <= 1 || (variant === 'table' && hasNetworkFilter))
  const showNetworkHover = variant === 'table' && chainIds.length > 1
  const logoSize = variant === 'search' ? iconSizes.icon40 : iconSizes.icon32

  const symbolSubline = (
    <Text
      variant="body3"
      color="$neutral2"
      numberOfLines={1}
      height={variant === 'table' ? TABLE_SUBLINE_HEIGHT : undefined}
    >
      {displaySymbol}
    </Text>
  )

  const networkSubline = (
    <Flex row alignItems="center" gap="$spacing6" height={variant === 'table' ? TABLE_SUBLINE_HEIGHT : undefined}>
      <Text variant="body3" color={variant === 'search' ? '$neutral3' : '$neutral2'} numberOfLines={1}>
        {t('explore.tokens.table.networks', { count: networkCount })}
      </Text>
      {variant === 'table' && <NetworkIconList chainIds={chainIds} />}
    </Flex>
  )

  // Search single-network issuer: show the truncated contract address (Figma) for the enabled chain, matching the
  // logo's network badge. Falls through to symbol-only when no chainToken is on an enabled chain.
  const addressSubline = primaryChain ? (
    <Text variant="body3" color="$neutral3" numberOfLines={1}>
      {shortenAddress({ address: primaryChain.address })}
    </Text>
  ) : null

  return (
    <Flex row gap="$spacing12" alignItems="center" width="100%" minWidth={0}>
      <TokenLogo
        url={issuer.logoUrl}
        symbol={displaySymbol}
        name={issuer.name}
        chainId={primaryChain?.chainId as UniverseChainId | undefined}
        size={logoSize}
        alwaysShowNetworkLogo={showNetworkBadge}
        hideNetworkLogo={!showNetworkBadge}
      />
      <Flex flex={1} minWidth={0}>
        <Flex row alignItems="baseline" gap="$spacing6" minWidth={0}>
          <Text variant={variant === 'search' ? 'body1' : 'body2'} color="$neutral1" numberOfLines={1} flexShrink={1}>
            {useIssuerNameAsPrimary ? issuer.name : asset.name}
          </Text>
          <Text variant="body3" color="$neutral3" numberOfLines={1} flexShrink={0}>
            {formatIssuerLabel(issuer.issuer)}
          </Text>
        </Flex>
        {showNetworkHover ? (
          <GroupHoverTransition
            showTransition
            height={TABLE_SUBLINE_HEIGHT}
            isHovered={issuerTableRowHovered}
            useGroupItemHover={issuerTableRowHovered === undefined}
            widthMode="container"
            defaultContent={symbolSubline}
            hoverContent={networkSubline}
          />
        ) : (
          <Flex row gap="$spacing8" minWidth={0}>
            {symbolSubline}
            {variant === 'search' ? (chainIds.length > 1 ? networkSubline : addressSubline) : null}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
