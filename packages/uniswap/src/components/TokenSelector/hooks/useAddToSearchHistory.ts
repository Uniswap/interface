import { useDispatch } from 'react-redux'
import { OnchainItemListOptionType, PoolOption, SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { PoolSearchResult, SearchResultType, TokenSearchResult } from 'uniswap/src/features/search/SearchResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { tokenAddressOrNativeAddress } from 'uniswap/src/features/search/utils'

export function useAddToSearchHistory(): {
  registerSearchItem: (item: SearchModalOption) => void
  registerSearchTokenCurrencyInfo: (currencyInfo: CurrencyInfo) => void
} {
  const dispatch = useDispatch()

  const registerSearchItem = (item: SearchModalOption): void => {
    switch (item.type) {
      case OnchainItemListOptionType.Pool:
        dispatch(addToSearchHistory({ searchResult: poolOptionToSearchResult(item) }))
        break
      case OnchainItemListOptionType.Token:
        dispatch(addToSearchHistory({ searchResult: currencyInfoToTokenSearchResult(item.currencyInfo) }))
        break
      case OnchainItemListOptionType.WalletByAddress:
      case OnchainItemListOptionType.Unitag:
      case OnchainItemListOptionType.ENSAddress:
        dispatch(
          addToSearchHistory({
            searchResult: { ...item, type: SearchResultType.WalletByAddress },
          }),
        )
        break
      case OnchainItemListOptionType.NFTCollection:
        dispatch(
          addToSearchHistory({
            searchResult: {
              ...item,
              type: SearchResultType.NFTCollection,
            },
          }),
        )
        break
    }
  }

  const registerSearchTokenCurrencyInfo = (currencyInfo: CurrencyInfo): void => {
    dispatch(addToSearchHistory({ searchResult: currencyInfoToTokenSearchResult(currencyInfo) }))
  }

  return { registerSearchItem, registerSearchTokenCurrencyInfo }
}

function poolOptionToSearchResult(item: PoolOption): PoolSearchResult {
  const { chainId, poolId, token0CurrencyInfo, token1CurrencyInfo, protocolVersion, feeTier } = item
  return {
    type: SearchResultType.Pool,
    chainId,
    poolId,
    token0CurrencyId: token0CurrencyInfo.currencyId,
    token1CurrencyId: token1CurrencyInfo.currencyId,
    protocolVersion,
    feeTier,
  }
}

function currencyInfoToTokenSearchResult(currencyInfo: CurrencyInfo): TokenSearchResult {
  const address = currencyInfo.currency.isToken
    ? currencyInfo.currency.address
    : getNativeAddress(currencyInfo.currency.chainId)

  return {
    type: SearchResultType.Token,
    chainId: currencyInfo.currency.chainId,
    address: tokenAddressOrNativeAddress(address, currencyInfo.currency.chainId),
    name: currencyInfo.currency.name ?? null,
    symbol: currencyInfo.currency.symbol ?? '',
    logoUrl: currencyInfo.logoUrl ?? null,
    safetyInfo: currencyInfo.safetyInfo,
    feeData: currencyInfo.currency.isToken
      ? {
          buyFeeBps: currencyInfo.currency.buyFeeBps?.gt(0) ? currencyInfo.currency.buyFeeBps.toString() : undefined,
          sellFeeBps: currencyInfo.currency.sellFeeBps?.gt(0) ? currencyInfo.currency.sellFeeBps.toString() : undefined,
        }
      : null,
  }
}
