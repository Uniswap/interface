import { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { Flex, iconSizes, Text } from '@universe/mycelium'
import { useContext, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import {
  formatIssuerDisplaySymbol,
  getIssuerTokenLabel,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol'
import {
  pickDisplayChainToken,
  pickFilteredChainToken,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/pickPrimaryChainToken'
import { getNetworkCount } from 'uniswap/src/data/apiClients/dataApiService/rwa/rwaMetrics'
import type { IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { IssuerTableRowHoverContext } from 'uniswap/src/features/expandableAsset/IssuerTableRowHoverContext'
import { TABLE_SUBLINE_HEIGHT, type ExpandableAssetGroupVariant } from 'uniswap/src/features/expandableAsset/types'
import { getIssuerTokenDisplayName } from 'uniswap/src/features/rwa/getIssuerTokenDisplayName'
import { getIssuerTokenPrimaryName } from 'uniswap/src/features/rwa/getIssuerTokenPrimaryName'
import { RWAIssuerTag } from 'uniswap/src/features/rwa/RWAIssuerTag'
import { shortenAddress } from 'utilities/src/addresses'

export type ExpandableIssuerIdentityProps = {
  asset: Rwa
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
  variant?: ExpandableAssetGroupVariant
  chainFilter?: UniverseChainId
  /** Flat single-issuer table row: show issuer token name instead of grouped asset name. */
  useIssuerNameAsPrimary?: boolean
  categoryTag?: ReactNode
  hideSublineFallback?: boolean
  showIssuerTag?: boolean
}

export function ExpandableIssuerIdentity({
  asset,
  issuer,
  enabledChainIds,
  variant = 'table',
  chainFilter,
  useIssuerNameAsPrimary = false,
  categoryTag,
  hideSublineFallback = false,
  showIssuerTag = false,
}: ExpandableIssuerIdentityProps): JSX.Element {
  const { t } = useTranslation()
  const issuerTableRowHovered = useContext(IssuerTableRowHoverContext)
  const displaySymbol = formatIssuerDisplaySymbol({
    baseSymbol: asset.symbol,
    apiSymbol: issuer.symbol,
  })
  const plainTokenNames = useIsTokenCategoriesEnabled()
  // Flag off: the legacy group name, or the affix-stripped on-chain name on flat rows.
  const legacyName = useIssuerNameAsPrimary
    ? getIssuerTokenDisplayName({ name: issuer.name, issuer: issuer.issuer })
    : asset.name
  const primaryName = getIssuerTokenPrimaryName({ tokenName: issuer.name, fallbackName: legacyName, plainTokenNames })
  const chainIds = issuer.chainTokens
    .map((chain) => chain.chainId as UniverseChainId)
    .filter((id) => enabledChainIds.includes(id))
  const networkCount = getNetworkCount(issuer, enabledChainIds)
  const filteredChain = pickFilteredChainToken({ chainTokens: issuer.chainTokens, enabledChainIds, chainFilter })
  const primaryChain = pickDisplayChainToken({ chainTokens: issuer.chainTokens, enabledChainIds, chainFilter })
  // Multichain issuers omit the logo badge unless a network filter is active (matches Explore tokens table).
  const showNetworkBadge = Boolean(primaryChain) && (chainIds.length <= 1 || Boolean(filteredChain))
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

  const searchSublineDetail = hideSublineFallback ? null : chainIds.length > 1 ? networkSubline : addressSubline

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
      <Flex flex={1} minWidth={0} gap={variant === 'search' ? '$spacing2' : undefined}>
        <Flex row alignItems="baseline" gap="$spacing6" minWidth={0}>
          <Text variant={variant === 'search' ? 'body1' : 'body2'} color="$neutral1" numberOfLines={1} flexShrink={1}>
            {primaryName}
          </Text>
          {showIssuerTag ? (
            <RWAIssuerTag issuer={issuer.issuer} />
          ) : (
            <Text variant="body3" color="$neutral3" numberOfLines={1} flexShrink={0}>
              {getIssuerTokenLabel(issuer)}
            </Text>
          )}
          {categoryTag}
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
            {variant === 'search' ? searchSublineDetail : null}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
