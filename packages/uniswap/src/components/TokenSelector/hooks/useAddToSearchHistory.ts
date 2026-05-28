import { useDispatch } from 'react-redux'
import {
  MultichainTokenOption,
  OnchainItemListOptionType,
  PoolOption,
  SearchModalOption,
} from 'uniswap/src/components/lists/items/types'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import {
  MultichainTokenSearchHistoryResult,
  PoolSearchHistoryResult,
  SearchHistoryResultType,
  TokenSearchHistoryResult,
} from 'uniswap/src/features/search/SearchHistoryResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { tokenAddressOrNativeAddress } from 'uniswap/src/features/search/utils'

export type RegisterSearchItemMeta = {
  /** For multichain token rows: persist TDP `?chain=` when user had a chain-scoped search. */
  tdpChainFilter?: UniverseChainId | null
}

export function useAddToSearchHistory(): {
  registerSearchItem: (item: SearchModalOption, meta?: RegisterSearchItemMeta) => void
  registerSearchTokenCurrencyInfo: (currencyInfo: CurrencyInfo) => void
} {
  const dispatch = useDispatch()

  const registerSearchItem = (item: SearchModalOption, meta?: RegisterSearchItemMeta): void => {
    switch (item.type) {
      case OnchainItemListOptionType.Pool:
        dispatch(addToSearchHistory({ searchResult: poolOptionToSearchHistoryResult(item) }))
        break
      case OnchainItemListOptionType.Token: {
        const { currencyInfo } = item
        if (currencyInfo.projectId) {
          const rowChainId = currencyInfo.currency.chainId
          const resolvedTdpChain = meta?.tdpChainFilter ?? (isUniverseChainId(rowChainId) ? rowChainId : null)
          dispatch(
            addToSearchHistory({
              searchResult: currencyInfoToMultichainSearchHistoryResult(currencyInfo, resolvedTdpChain),
            }),
          )
        } else {
          dispatch(addToSearchHistory({ searchResult: currencyInfoToTokenSearchHistoryResult(currencyInfo) }))
        }
        break
      }
      case OnchainItemListOptionType.MultichainToken:
        dispatch(
          addToSearchHistory({ searchResult: multichainTokenOptionToSearchHistoryResult(item, meta?.tdpChainFilter) }),
        )
        break
      case OnchainItemListOptionType.WalletByAddress:
      case OnchainItemListOptionType.Unitag:
      case OnchainItemListOptionType.ENSAddress:
        dispatch(
          addToSearchHistory({
            // ensName, unitag, primaryENSName, etc are dynamic and should be re-fetched at calltime
            // so we add to search history as a simple `WalletByAddress` type and do the refetching inside WalletByAddressOptionItem
            searchResult: { address: item.address, type: SearchHistoryResultType.WalletByAddress },
          }),
        )
        break
    }
  }

  const registerSearchTokenCurrencyInfo = (currencyInfo: CurrencyInfo): void => {
    const projectId = currencyInfo.projectId
    if (projectId) {
      const rowChainId = currencyInfo.currency.chainId
      const resolvedTdpChain = isUniverseChainId(rowChainId) ? rowChainId : null
      dispatch(
        addToSearchHistory({
          searchResult: currencyInfoToMultichainSearchHistoryResult({ ...currencyInfo, projectId }, resolvedTdpChain),
        }),
      )
    } else {
      dispatch(addToSearchHistory({ searchResult: currencyInfoToTokenSearchHistoryResult(currencyInfo) }))
    }
  }

  return { registerSearchItem, registerSearchTokenCurrencyInfo }
}

function poolOptionToSearchHistoryResult(item: PoolOption): PoolSearchHistoryResult {
  const { chainId, poolId, token0CurrencyInfo, token1CurrencyInfo, protocolVersion, feeTier } = item
  return {
    type: SearchHistoryResultType.Pool,
    chainId,
    poolId,
    token0CurrencyId: token0CurrencyInfo.currencyId,
    token1CurrencyId: token1CurrencyInfo.currencyId,
    protocolVersion,
    feeTier,
  }
}

function multichainTokenOptionToSearchHistoryResult(
  item: MultichainTokenOption,
  metaTdpChainFilter?: UniverseChainId | null,
): MultichainTokenSearchHistoryResult {
  const { multichainResult } = item
  const tdpChainFilter = metaTdpChainFilter ?? item.tdpChainFilter
  return {
    type: SearchHistoryResultType.MultichainToken,
    multichainId: multichainResult.id,
    name: multichainResult.name,
    symbol: multichainResult.symbol,
    logoUrl: multichainResult.logoUrl ?? undefined,
    tokenCurrencyIds: multichainResult.tokens.map((t) => t.currencyId),
    ...(tdpChainFilter != null && isUniverseChainId(tdpChainFilter) ? { tdpChainFilter } : {}),
  }
}

function currencyInfoToMultichainSearchHistoryResult(
  currencyInfo: CurrencyInfo,
  metaTdpChainFilter?: UniverseChainId | null,
): MultichainTokenSearchHistoryResult {
  const tdpChainFilter =
    metaTdpChainFilter != null && isUniverseChainId(metaTdpChainFilter) ? metaTdpChainFilter : undefined
  return {
    type: SearchHistoryResultType.MultichainToken,
    multichainId: currencyInfo.projectId ?? '',
    name: currencyInfo.currency.name ?? '',
    symbol: currencyInfo.currency.symbol ?? '',
    logoUrl: currencyInfo.logoUrl ?? undefined,
    /** Persist the clicked row when we do not have the full multichain token list; slice requires a non-empty array. */
    tokenCurrencyIds: [currencyInfo.currencyId],
    ...(tdpChainFilter != null ? { tdpChainFilter } : {}),
  }
}

function currencyInfoToTokenSearchHistoryResult(currencyInfo: CurrencyInfo): TokenSearchHistoryResult {
  const address = currencyInfo.currency.isToken
    ? currencyInfo.currency.address
    : getNativeAddress(currencyInfo.currency.chainId)

  return {
    type: SearchHistoryResultType.Token,
    chainId: currencyInfo.currency.chainId,
    address: tokenAddressOrNativeAddress(address, currencyInfo.currency.chainId),
  }
}
