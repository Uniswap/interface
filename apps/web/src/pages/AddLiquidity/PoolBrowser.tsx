import type { Currency } from '@uniswap/sdk-core'
import { useQueryStates } from 'nuqs'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Button, Flex } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { ExpandableSearchInput } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { CurrencySelector } from '~/features/Liquidity/CurrencySelector'
import { parseAsChainId, parseAsCurrencyAddress } from '~/features/Liquidity/parsers/urlParsers'
import { useCurrencyInfo } from '~/hooks/Tokens'
import { useDebounce } from '~/hooks/useDebounce'
import { buildPoolSearchParams } from '~/pages/AddLiquidity/poolLinkParams'
import { useAddLiquidityPools } from '~/pages/AddLiquidity/useAddLiquidityPools'
import type { PoolLinkData } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { usePoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'
import { SwitchNetworkAction } from '~/state/popups/types'
import { getChainUrlParam } from '~/utils/params/chainParams'

const FEW_RESULTS_THRESHOLD = 10

export function PoolBrowser(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const entryPoint = (location.state as { entryPoint?: string } | null)?.entryPoint

  const [browserUrlState, setBrowserUrlState] = useQueryStates(
    {
      currencyA: parseAsCurrencyAddress.withDefault(''),
      currencyB: parseAsCurrencyAddress.withDefault(''),
      chain: parseAsChainId,
    },
    { history: 'replace' },
  )

  const [currencySearchInputState, setCurrencySearchInputState] = useState<'token0' | 'token1' | undefined>(undefined)

  const selectedChainId = browserUrlState.chain ?? undefined
  const [tokenChainId, setTokenChainId] = useState<UniverseChainId | undefined>(selectedChainId)

  const currency0Info = useCurrencyInfo(browserUrlState.currencyA || undefined, tokenChainId)
  const currency1Info = useCurrencyInfo(browserUrlState.currencyB || undefined, tokenChainId)
  const currency0 = currency0Info?.currency
  const currency1 = currency1Info?.currency

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      const address = currency.isNative ? NATIVE_CHAIN_ID : currency.address
      if (currencySearchInputState === 'token0') {
        setBrowserUrlState({ currencyA: address, chain: currency.chainId })
      } else if (currencySearchInputState === 'token1') {
        setBrowserUrlState({ currencyB: address, chain: currency.chainId })
      }
      setTokenChainId(currency.chainId)
      setCurrencySearchInputState(undefined)
    },
    [currencySearchInputState, setBrowserUrlState],
  )

  const handleClearCurrency0 = useCallback(() => {
    setBrowserUrlState({ currencyA: '' })
  }, [setBrowserUrlState])

  const handleClearCurrency1 = useCallback(() => {
    setBrowserUrlState({ currencyB: '' })
  }, [setBrowserUrlState])

  const handleChainSelect = useCallback(
    (chainId: UniverseChainId | undefined) => {
      const hasTokens = Boolean(browserUrlState.currencyA || browserUrlState.currencyB)
      if (hasTokens && chainId !== undefined && chainId !== tokenChainId) {
        setBrowserUrlState({ chain: chainId, currencyA: '', currencyB: '' })
        setTokenChainId(undefined)
      } else {
        setBrowserUrlState({ chain: chainId ?? null })
      }
    },
    [setBrowserUrlState, tokenChainId, browserUrlState.currencyA, browserUrlState.currencyB],
  )

  const [filterString, setFilterString] = useState('')
  const debouncedFilterString = useDebounce(filterString, 300)

  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))

  const {
    pools,
    isLoading,
    isError,
    loadMore: backendLoadMore,
    hasNextPage,
  } = useAddLiquidityPools({
    currency0,
    currency1,
    chainId: selectedChainId,
    filterString: debouncedFilterString,
    sortState: {
      sortBy: sortMethod,
      sortDirection: sortAscending ? OrderDirection.Asc : OrderDirection.Desc,
    },
  })

  const getPoolLink = useCallback((pool: PoolLinkData) => {
    const base = `/positions/add/${getChainUrlParam(pool.chainId)}/${pool.poolIdOrHash}`
    const params = buildPoolSearchParams({
      currencyA: pool.token0Address ?? NATIVE_CHAIN_ID,
      currencyB: pool.token1Address ?? NATIVE_CHAIN_ID,
      chain: getChainUrlParam(pool.chainId),
      fee: pool.fee,
      hookAddress: pool.hookAddress,
      protocolVersion: pool.protocolVersion,
    })
    const search = params.toString()
    return search ? `${base}?${search}` : base
  }, [])

  const showCreatePool = !isLoading && !hasNextPage && pools && pools.length > 0 && pools.length < FEW_RESULTS_THRESHOLD

  return (
    <>
      {/* Token selectors + Filters row */}
      <Flex
        row
        justifyContent="space-between"
        alignItems="center"
        width="100%"
        gap="$spacing16"
        height="40px"
        mb="$spacing16"
      >
        <Flex row gap="$spacing8" height="100%">
          <CurrencySelector
            currencyInfo={currency0Info}
            onPress={() => setCurrencySearchInputState('token0')}
            onClear={handleClearCurrency0}
            placeholder={t('addLiquidity.selectFirstToken')}
            emphasis="tertiary"
            index={0}
          />
          <CurrencySelector
            currencyInfo={currency1Info}
            onPress={() => setCurrencySearchInputState('token1')}
            onClear={handleClearCurrency1}
            placeholder={t('addLiquidity.selectSecondToken')}
            emphasis="tertiary"
            index={1}
          />
        </Flex>
        <Flex row gap="$spacing8" alignItems="center" height="100%">
          <ExpandableSearchInput
            value={filterString}
            onChangeText={setFilterString}
            placeholder={t('tokens.table.search.placeholder.pools')}
          />
          <NetworkFilter position="right" onPress={handleChainSelect} currentChainId={selectedChainId} />
        </Flex>
      </Flex>

      {/* Pool table */}
      <PoolsTable
        pools={pools}
        loading={isLoading}
        error={isError}
        loadMore={backendLoadMore}
        hiddenColumns={[PoolSortFields.VolOverTvl, PoolSortFields.Volume24h, PoolSortFields.RewardApr]}
        hideIndex
        getLink={getPoolLink}
        linkState={entryPoint ? { entryPoint } : undefined}
      />
      {showCreatePool && (
        <Flex alignItems="center" mt="$spacing16">
          <Button
            fill={false}
            emphasis="text-only"
            icon={<Plus color="$neutral2" />}
            onPress={() => navigate('/positions/add/new')}
          >
            <Button.Text color="$neutral2">{t('addLiquidity.createNewPool')}</Button.Text>
          </Button>
        </Flex>
      )}

      {/* Currency search modal */}
      <CurrencySearchModal
        isOpen={currencySearchInputState !== undefined}
        onDismiss={() => setCurrencySearchInputState(undefined)}
        switchNetworkAction={SwitchNetworkAction.LP}
        onCurrencySelect={handleCurrencySelect}
        flow={TokenSelectorFlow.Liquidity}
      />
    </>
  )
}
