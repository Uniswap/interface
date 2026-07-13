import type { ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import type { FocusedRowControl } from 'uniswap/src/components/lists/items/OptionItem'
import type { RwaCollectionOption, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { resolvePrimaryChain, type ResolvedPrimaryChain } from 'uniswap/src/data/rest/rwa/resolvePrimaryChain'
import type { IssuerToken } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ExpandableAssetGroup } from 'uniswap/src/features/expandableAsset/ExpandableAssetGroup'
import type { RenderIssuerRowArgs } from 'uniswap/src/features/expandableAsset/types'
import { SearchHistoryResultType } from 'uniswap/src/features/search/SearchHistoryResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { sendSearchOptionItemClickedAnalytics } from 'uniswap/src/features/search/SearchModal/analytics/analytics'
import type { SearchFilterContext } from 'uniswap/src/features/search/SearchModal/analytics/SearchContext'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
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

  const recordIssuerSelection = (resolved: ResolvedPrimaryChain): void => {
    const { chainToken, chainId } = resolved
    // Record a token search-history entry directly — RWA data has no SDK Currency, so do NOT
    // build a CurrencyInfo / call registerSearchItem's Token branch. Recents reconstitute it.
    dispatch(
      addToSearchHistory({
        searchResult: {
          type: SearchHistoryResultType.Token,
          chainId,
          address: chainToken.address,
        },
      }),
    )
    sendSearchOptionItemClickedAnalytics({
      item,
      section,
      sectionIndex: index,
      rowIndex,
      searchFilters,
      rwaSelection: { chainId, address: chainToken.address },
    })
  }
  const selectIssuer = (issuer: IssuerToken): void => {
    // Navigate to the issuer's displayed primary chain — the first enabled chainToken (chainTokens are
    // sorted mainnet-first upstream) — so navigation, the row's logo, and analytics target the same chain.
    const resolved = resolvePrimaryChain({ issuer, enabledChainIds })
    if (!resolved) {
      logger.warn('RwaCollectionItem', 'selectIssuer', 'RWA issuer has no enabled/supported chainToken', {
        issuer: issuer.issuer,
        symbol: rwa.symbol,
      })
      return
    }
    recordIssuerSelection(resolved)
    navigateToTokenDetails(buildCurrencyId(resolved.chainId, resolved.chainToken.address))
    onSelect?.()
  }

  const recordIssuerModifierPress = (issuer: IssuerToken): void => {
    const resolved = resolvePrimaryChain({ issuer, enabledChainIds })
    if (!resolved) {
      logger.warn('RwaCollectionItem', 'recordIssuerModifierPress', 'RWA issuer has no enabled/supported chainToken', {
        issuer: issuer.issuer,
        symbol: rwa.symbol,
      })
      return
    }
    recordIssuerSelection(resolved)
  }

  const issuerHref = (issuer: IssuerToken): string | undefined => {
    const resolved = resolvePrimaryChain({ issuer, enabledChainIds })
    return resolved ? getTokenDetailsUrl?.(buildCurrencyId(resolved.chainId, resolved.chainToken.address)) : undefined
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
