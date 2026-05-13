import type { Currency } from '@uniswap/sdk-core'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, Text } from 'ui/src'
import { Chevron } from 'ui/src/components/icons/Chevron'
import { Plus } from 'ui/src/components/icons/Plus'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { PoolSortFields } from '~/appGraphql/data/pools/useTopPools'
import { OrderDirection } from '~/appGraphql/data/util'
import { BreadcrumbNavContainer, BreadcrumbNavLink } from '~/components/BreadcrumbNav'
import { ExpandableSearchInput } from '~/components/ExpandableSearchInput/ExpandableSearchInput'
import { NetworkFilter } from '~/components/NetworkFilter/NetworkFilter'
import { CurrencySearchModal } from '~/components/SearchModal/CurrencySearchModal'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { CurrencySelector } from '~/features/Liquidity/Create/SelectTokenStep'
import { useDebounce } from '~/hooks/useDebounce'
import { useAddLiquidityPools } from '~/pages/AddLiquidity/useAddLiquidityPools'
import { PoolsTable } from '~/pages/Explore/tables/Pools/PoolTable'
import { PoolTableStoreContextProvider, usePoolTableStore } from '~/pages/Explore/tables/Pools/poolTableStore'
import { SwitchNetworkAction } from '~/state/popups/types'
import { getChainUrlParam } from '~/utils/params/chainParams'

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

  // Token selection state
  const [currency0, setCurrency0] = useState<Currency | undefined>()
  const [currency1, setCurrency1] = useState<Currency | undefined>()
  const [currencySearchInputState, setCurrencySearchInputState] = useState<'token0' | 'token1' | undefined>(undefined)

  const currency0Info = useCurrencyInfo(currencyId(currency0))
  const currency1Info = useCurrencyInfo(currencyId(currency1))

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (currencySearchInputState === 'token0') {
        setCurrency0(currency)
      } else if (currencySearchInputState === 'token1') {
        setCurrency1(currency)
      }
      setCurrencySearchInputState(undefined)
    },
    [currencySearchInputState],
  )

  const [filterString, setFilterString] = useState('')
  const debouncedFilterString = useDebounce(filterString, 300)

  // Chain filter state
  const [selectedChainId, setSelectedChainId] = useState<UniverseChainId | undefined>(undefined)

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

  const getPoolLink = useCallback(
    (chainId: UniverseChainId, poolIdOrHash: string) => `/positions/add/${getChainUrlParam(chainId)}/${poolIdOrHash}`,
    [],
  )

  return (
    <Trace logImpression page={InterfacePageName.AddLiquidity}>
      <Flex width="100%" maxWidth={1200} mx="auto" py="$spacing24" px="$spacing16">
        {/* Breadcrumbs */}
        <BreadcrumbNavContainer aria-label="breadcrumb-nav">
          <BreadcrumbNavLink to="/explore/pools">
            {t('common.pools')} <Chevron size="$icon.16" color="$neutral2" rotate="180deg" />
          </BreadcrumbNavLink>
          <Text color="$neutral2">{t('common.addLiquidity')}</Text>
        </BreadcrumbNavContainer>

        {/* Title row */}
        <Flex row justifyContent="space-between" alignItems="center" width="100%" mb="$spacing24">
          <Flex grow>
            <Text variant="heading3">{t('addLiquidity.choosePool')}</Text>
          </Flex>
          <Button fill={false} emphasis="text-only" icon={<Plus />} onPress={() => navigate('/positions/add/new')}>
            {t('addLiquidity.createPool')}
          </Button>
        </Flex>

        {/* Token selectors + Filters row */}
        <Flex row justifyContent="space-between" alignItems="center" width="100%" gap="$spacing16" height="40px">
          {/* Left: Token selectors */}
          <Flex row gap="$spacing8" height="100%">
            <CurrencySelector currencyInfo={currency0Info} onPress={() => setCurrencySearchInputState('token0')} />
            <CurrencySelector currencyInfo={currency1Info} onPress={() => setCurrencySearchInputState('token1')} />
          </Flex>

          {/* Right: Filters */}
          <Flex row gap="$spacing8" alignItems="center" height="100%">
            <ExpandableSearchInput
              value={filterString}
              onChangeText={setFilterString}
              placeholder={t('tokens.table.search.placeholder.pools')}
            />
            <NetworkFilter position="right" onPress={setSelectedChainId} currentChainId={selectedChainId} />
          </Flex>
        </Flex>

        {/* Pool table */}
        <Flex mt="$spacing16">
          <PoolsTable
            pools={pools}
            loading={isLoading}
            error={isError}
            loadMore={backendLoadMore}
            maxWidth={1200}
            hiddenColumns={[PoolSortFields.VolOverTvl]}
            getLink={getPoolLink}
          />
        </Flex>

        {/* Currency search modal */}
        <CurrencySearchModal
          isOpen={currencySearchInputState !== undefined}
          onDismiss={() => setCurrencySearchInputState(undefined)}
          switchNetworkAction={SwitchNetworkAction.LP}
          onCurrencySelect={handleCurrencySelect}
          flow={TokenSelectorFlow.Liquidity}
        />
      </Flex>
    </Trace>
  )
}
