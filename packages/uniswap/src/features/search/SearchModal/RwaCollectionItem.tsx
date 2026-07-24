import type { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import type { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import type { RwaCollectionOption, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { resolvePrimaryChain } from 'uniswap/src/data/rest/rwa/resolvePrimaryChain'
import type { IssuerToken } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { ExpandableAssetGroup } from 'uniswap/src/features/expandableAsset/ExpandableAssetGroup'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import type { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { tdpChainFilterForTokenRow } from 'uniswap/src/features/search/SearchModal/utils/searchModalListItem'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { tdpChainSelectionFromFilter } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'

type RwaCollectionItemProps = {
  item: RwaCollectionOption
  expanded: boolean
  searchFilters: SearchFilterContext
  section: OnchainItemSection<SearchModalOption>
  index: number
  rowIndex: number
  focusedRowControl: FocusedRowControl
  renderIssuerRow: (args: RenderIssuerRowArgs) => ReactNode
  isIssuerMenuReady: (issuer: IssuerToken) => boolean
  onToggle: () => void
  onSelect?: () => void
  testID?: string
}

export function RwaCollectionItem({
  item,
  expanded,
  searchFilters,
  section,
  index,
  rowIndex,
  focusedRowControl,
  renderIssuerRow,
  isIssuerMenuReady,
  onToggle,
  onSelect,
  testID,
}: RwaCollectionItemProps): JSX.Element {
  const { navigateToTokenDetails, getTokenDetailsUrl } = useUniswapContext()
  const dispatch = useDispatch()
  const { chains: enabledChainIds } = useEnabledChains()

  const { rwa } = item
  const canExpand = rwa.issuerTokens.length > 1
  // The lone issuer for a non-expandable collection (the parent row navigates to it directly).
  const soleIssuer = canExpand ? undefined : rwa.issuerTokens[0]

  type IssuerNavigation = {
    chainId: UniverseChainId
    address: string
    primaryCurrencyId: string
    tokenCurrencyIds: string[]
    isMultichain: boolean
    // Tri-state TDP network intent (chainId | null aggregate | undefined own-chain), matching the sibling
    // token/multichain rows in SearchModalList — honors an active chain-scoped search filter.
    tdpChain: UniverseChainId | null | undefined
  }

  // Resolve an issuer's navigation target without side effects. The primary chain is the first enabled
  // chainToken (chainTokens are sorted mainnet-first upstream), so the path address, row logo, and
  // analytics all target the same chain.
  const resolveIssuerNavigation = (issuer: IssuerToken): IssuerNavigation | undefined => {
    const resolved = resolvePrimaryChain({ issuer, enabledChainIds })
    if (!resolved) {
      return undefined
    }
    const { chainToken, chainId } = resolved
    const primaryCurrencyId = buildCurrencyId(chainId, chainToken.address)
    // All of the issuer's supported chain deployments, primary first, so recents reconstitute with the
    // correct network count.
    const tokenCurrencyIds = [
      primaryCurrencyId,
      ...issuer.chainTokens
        .map((token) => {
          const tokenChainId = toSupportedChainId(token.chainId)
          return tokenChainId ? buildCurrencyId(tokenChainId, token.address) : undefined
        })
        .filter((id): id is string => id != null && id !== primaryCurrencyId),
    ]
    const isMultichain = tokenCurrencyIds.length > 1
    // Only single-deployment issuers fall back to their own chain; genuinely multichain issuers open the
    // aggregate view when no chain filter is active.
    const tdpChain = tdpChainFilterForTokenRow({
      searchChainFilter: searchFilters.searchChainFilter,
      rowChainId: chainId,
      searchQuery: searchFilters.query,
      allowAggregate: isMultichain,
    })
    return { chainId, address: chainToken.address, primaryCurrencyId, tokenCurrencyIds, isMultichain, tdpChain }
  }

  const warnUnresolvedIssuer = (method: string, issuer: IssuerToken): void => {
    logger.warn('RwaCollectionItem', method, 'RWA issuer has no enabled/supported chainToken', {
      issuer: issuer.issuer,
      symbol: rwa.symbol,
    })
  }

  const recordIssuerSelection = (issuer: IssuerToken, nav: IssuerNavigation): void => {
    const { chainId, address, primaryCurrencyId, tokenCurrencyIds, isMultichain, tdpChain } = nav
    // RWA data has no SDK Currency, so record the history entry directly (no CurrencyInfo / registerSearchItem).
    // Single-deployment issuers persist as a plain token; multichain issuers persist the aggregate row (with
    // the active chain filter, if any, so recents reopen the same network).
    dispatch(
      addToSearchHistory({
        searchResult: isMultichain
          ? {
              type: SearchHistoryResultType.MultichainToken,
              multichainId: primaryCurrencyId,
              name: issuer.name,
              symbol: issuer.symbol,
              logoUrl: issuer.logoUrl,
              tokenCurrencyIds,
              ...(tdpChain != null ? { tdpChainFilter: tdpChain } : {}),
            }
          : {
              type: SearchHistoryResultType.Token,
              chainId,
              address,
            },
      }),
    )
    sendSearchOptionItemClickedAnalytics({
      item,
      section,
      sectionIndex: index,
      rowIndex,
      searchFilters,
      rwaSelection: { chainId, address },
    })
  }

  const selectIssuer = (issuer: IssuerToken): void => {
    const nav = resolveIssuerNavigation(issuer)
    if (!nav) {
      warnUnresolvedIssuer('selectIssuer', issuer)
      return
    }
    recordIssuerSelection(issuer, nav)
    navigateToTokenDetails(buildCurrencyId(nav.chainId, nav.address), tdpChainSelectionFromFilter(nav.tdpChain))
    onSelect?.()
  }

  const recordIssuerModifierPress = (issuer: IssuerToken): void => {
    const nav = resolveIssuerNavigation(issuer)
    if (!nav) {
      warnUnresolvedIssuer('recordIssuerModifierPress', issuer)
      return
    }
    recordIssuerSelection(issuer, nav)
  }

  const issuerHref = (issuer: IssuerToken): string | undefined => {
    const nav = resolveIssuerNavigation(issuer)
    return nav
      ? getTokenDetailsUrl?.(buildCurrencyId(nav.chainId, nav.address), tdpChainSelectionFromFilter(nav.tdpChain))
      : undefined
  }

  return (
    <ExpandableAssetGroup
      asset={rwa}
      enabledChainIds={enabledChainIds}
      isExpanded={expanded}
      showCategoryTag={item.showCategoryTag ?? true}
      focusedRowControl={focusedRowControl}
      testID={testID}
      renderIssuerRow={renderIssuerRow}
      isIssuerMenuReady={isIssuerMenuReady}
      getIssuerHref={issuerHref}
      onToggle={onToggle}
      onParentPress={soleIssuer && (() => selectIssuer(soleIssuer))}
      onIssuerModifierPress={recordIssuerModifierPress}
      // Multi-issuer: each expanded sub-row gets its own press handler.
      onIssuerPress={selectIssuer}
    />
  )
}
