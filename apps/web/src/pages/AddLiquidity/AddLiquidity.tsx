import type { Currency } from '@uniswap/sdk-core'
import { useQueryStates } from 'nuqs'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Button, Flex, Text } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Plus } from 'ui/src/components/icons/Plus'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { ExpandableSearchInput } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { PageLayout } from '~/features/Liquidity/Create/Container'
import { useEntryPointBreadcrumb } from '~/features/Liquidity/Create/hooks/useEntryPointBreadcrumb'
import { CurrencySelector } from '~/features/Liquidity/Create/SelectTokenStep'
import { parseAsChainId, parseAsCurrencyAddress } from '~/features/Liquidity/parsers/urlParsers'
import { useCurrencyInfo } from '~/hooks/Tokens'
import { useDebounce } from '~/hooks/useDebounce'
import { buildPoolSearchParams } from '~/pages/AddLiquidity/poolLinkParams'
import { useAddLiquidityPools } from '~/pages/AddLiquidity/useAddLiquidityPools'
import type { PoolLinkData } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolTableStoreContextProvider, usePoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'
import { SwitchNetworkAction } from '~/state/popups/types'
import { getChainUrlParam } from '~/utils/params/chainParams'

const FEW_RESULTS_THRESHOLD = 10

export default function AddLiquidity(): JSX.Element {
  // These providers create independent store instances — no shared state with the explore page
  return (
    <ExploreTablesFilterStoreContextProvider>
      <PoolTableStoreContextProvider>
        <AddLiquidityContent />
      </PoolTableStoreContextProvider>
    </ExploreTablesFilterStoreContextProvider>
  )
}

function AddLiquidityContent(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const entryPointBreadcrumb = useEntryPointBreadcrumb()
  const entryPoint = (location.state as { entryPoint?: string } | null)?.entryPoint

  // Token selection and chain filter persisted in URL search params
  const [urlState, setUrlState] = useQueryStates(
    {
      currencyA: parseAsCurrencyAddress.withDefault(''),
      currencyB: parseAsCurrencyAddress.withDefault(''),
      chain: parseAsChainId,
    },
    { history: 'replace' },
  )

  const [currencySearchInputState, setCurrencySearchInputState] = useState<'token0' | 'token1' | undefined>(undefined)

  const selectedChainId = urlState.chain ?? undefined
  // Token chain is tracked independently so the NetworkFilter doesn't shift currency resolution
  const [tokenChainId, setTokenChainId] = useState<UniverseChainId | undefined>(selectedChainId)

  const currency0Info = useCurrencyInfo(urlState.currencyA || undefined, tokenChainId)
  const currency1Info = useCurrencyInfo(urlState.currencyB || undefined, tokenChainId)
  const currency0 = currency0Info?.currency
  const currency1 = currency1Info?.currency

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      const address = currency.isNative ? NATIVE_CHAIN_ID : currency.address
      if (currencySearchInputState === 'token0') {
        setUrlState({ currencyA: address, chain: currency.chainId })
      } else if (currencySearchInputState === 'token1') {
        setUrlState({ currencyB: address, chain: currency.chainId })
      }
      setTokenChainId(currency.chainId)
      setCurrencySearchInputState(undefined)
    },
    [currencySearchInputState, setUrlState],
  )

  const handleChainSelect = useCallback(
    (chainId: UniverseChainId | undefined) => {
      const hasTokens = Boolean(urlState.currencyA || urlState.currencyB)
      if (hasTokens && chainId !== undefined && chainId !== tokenChainId) {
        setUrlState({ chain: chainId, currencyA: '', currencyB: '' })
        setTokenChainId(undefined)
      } else {
        setUrlState({ chain: chainId ?? null })
      }
    },
    [setUrlState, tokenChainId, urlState.currencyA, urlState.currencyB],
  )

  const [filterString, setFilterString] = useState('')
  const debouncedFilterString = useDebounce(filterString, 300)

  // Sort state — driven by the local pool table store instance
  const { sortMethod, sortAscending } = usePoolTableStore((s) => ({
    sortMethod: s.sortMethod,
    sortAscending: s.sortAscending,
  }))

  // Fetch pools — switches between top pools and ListPools based on token selection
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

  return (
    <Trace logImpression page={InterfacePageName.AddLiquidity}>
      <PageLayout py="$spacing24">
        {/* Breadcrumbs */}
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink to={entryPointBreadcrumb.to}>
            {entryPointBreadcrumb.label} <Chevron size="$icon.16" color="$neutral2" rotate="180deg" />
          </BreadcrumbNavLink>
          <Text color="$neutral1">{t('common.addLiquidity')}</Text>
        </BreadcrumbNavContainer>

        {/* Title row */}
        <Flex row justifyContent="space-between" alignItems="center" width="100%" mb="$spacing24">
          <Flex grow>
            <Text variant="heading3">{t('addLiquidity.choosePool')}</Text>
          </Flex>
          <Button
            fill={false}
            emphasis="text-only"
            icon={<Plus color="$neutral2" />}
            onPress={() => navigate('/positions/add/new')}
          >
            <Button.Text color="$neutral2">{t('addLiquidity.createPool')}</Button.Text>
          </Button>
        </Flex>

        {/* Token selectors + Filters row */}
        <Flex row justifyContent="space-between" alignItems="center" width="100%" gap="$spacing16" height="40px">
          {/* Left: Token selectors */}
          <Flex row gap="$spacing8" height="100%">
            <CurrencySelector
              currencyInfo={currency0Info}
              onPress={() => setCurrencySearchInputState('token0')}
              placeholder={t('addLiquidity.selectFirstToken')}
              emphasis="tertiary"
            />
            <CurrencySelector
              currencyInfo={currency1Info}
              onPress={() => setCurrencySearchInputState('token1')}
              placeholder={t('addLiquidity.selectSecondToken')}
              emphasis="tertiary"
            />
          </Flex>

          {/* Right: Filters */}
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
        <Flex mt="$spacing16">
          <PoolsTable
            pools={pools}
            loading={isLoading}
            error={isError}
            loadMore={backendLoadMore}
            hiddenColumns={[PoolSortFields.VolOverTvl]}
            getLink={getPoolLink}
            linkState={entryPoint ? { entryPoint } : undefined}
          />
        </Flex>

        {/* Create pool button — shown when there are few results and nothing more to load */}
        {!isLoading && !hasNextPage && pools && pools.length > 0 && pools.length < FEW_RESULTS_THRESHOLD && (
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
      </PageLayout>
    </Trace>
  )
}
