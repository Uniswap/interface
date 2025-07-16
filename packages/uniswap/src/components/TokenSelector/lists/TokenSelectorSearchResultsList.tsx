import { apolloSubgraphClient } from 'graphql/data/apollo/client'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelectorList } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { useAddToSearchHistory } from 'uniswap/src/components/TokenSelector/hooks/useAddToSearchHistory'
import { OnSelectCurrency, TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import { NoResultsFound } from 'uniswap/src/components/lists/NoResultsFound'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GetPoolsByTokenQuery, useGetAllPoolsQuery } from 'v3-subgraph/generated/types-and-hooks'
import { smartBCHTokenOptions } from './smartBCH'

const filterOutSearch = (search: string | undefined, pools?: GetPoolsByTokenQuery['pools']) => {
  if (search == null || pools == null) return pools
  return pools.filter((p) => {
    return [p.token0.name, p.token0.symbol].some((s) => s.toLowerCase().startsWith(search.toLowerCase()))
  })
}

function _TokenSelectorSearchResultsList({
  onSelectCurrency: parentOnSelectCurrency,
  activeAccountAddress,
  chainFilter,
  parsedChainFilter,
  searchFilter,
  debouncedSearchFilter,
  debouncedParsedSearchFilter,
  isBalancesOnlySearch,
  isKeyboardOpen,
  input,
}: {
  onSelectCurrency: OnSelectCurrency
  activeAccountAddress?: string
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  isBalancesOnlySearch: boolean
  isKeyboardOpen?: boolean
  input: TradeableAsset | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const { registerSearch } = useAddToSearchHistory()
  const {
    data: poolData,
    loading: isLoading,
    error,
    refetch,
  } = useGetAllPoolsQuery({
    client: apolloSubgraphClient,
  })
  const chainInfo = getChainInfo(10000)
  const data = useMemo(() => {
    const tokensWithPools = poolData?.pools.flatMap((p) => [p.token0.id, p.token1.id])?.map((s) => s.toLowerCase())
    if (tokensWithPools?.includes(chainInfo.wrappedNativeCurrency.address.toLowerCase())) {
      tokensWithPools.push(chainInfo.nativeCurrency.address.toLowerCase())
    }
    const smartBCHTokenOptionsInPools = smartBCHTokenOptions.filter((t) =>
      tokensWithPools?.includes(t.currencyInfo.address?.toLowerCase()),
    )
    console.log('smartBCHTokenOptionsInPools', smartBCHTokenOptionsInPools)
    return smartBCHTokenOptionsInPools.filter((t) =>
      [t.currencyInfo.symbol, t.currencyInfo.name].some((s) => s?.toLowerCase().startsWith(searchFilter.toLowerCase())),
    )
  }, [searchFilter, poolData])
  const onSelectCurrency: OnSelectCurrency = (currencyInfo, section, index) => {
    parentOnSelectCurrency(currencyInfo, section, index)
    registerSearch(currencyInfo)
  }

  const userIsTyping = Boolean(searchFilter && debouncedSearchFilter !== searchFilter)

  const emptyElement = useMemo(
    () => (debouncedSearchFilter ? <NoResultsFound searchFilter={debouncedSearchFilter} /> : undefined),
    [debouncedSearchFilter],
  )
  return (
    <TokenSelectorList
      showTokenAddress
      chainFilter={chainFilter}
      emptyElement={emptyElement}
      errorText={t('token.selector.search.error')}
      hasError={Boolean(error)}
      isKeyboardOpen={isKeyboardOpen}
      loading={userIsTyping || isLoading}
      refetch={refetch}
      sections={[{ data, sectionKey: TokenOptionSection.SuggestedTokens }]}
      showTokenWarnings={true}
      onSelectCurrency={onSelectCurrency}
    />
  )
}

export const TokenSelectorSearchResultsList = memo(_TokenSelectorSearchResultsList)
