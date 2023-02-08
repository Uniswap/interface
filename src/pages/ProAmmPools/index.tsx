import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp } from 'react-feather'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { Input as PaginationInput } from 'components/Pagination/PaginationInputOnMobile'
import ShareModal from 'components/ShareModal'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { SelectPairInstructionWrapper } from 'pages/Pools/styleds'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { FarmUpdater, useElasticFarms } from 'state/farms/elastic/hooks'
import { Field } from 'state/mint/proamm/type'
import { useTopPoolAddresses, useUserProMMPositions } from 'state/prommPools/hooks'
import useGetElasticPools from 'state/prommPools/useGetElasticPools'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { MEDIA_WIDTHS } from 'theme'
import { ElasticPoolDetail } from 'types/pool'

import ProAmmPoolCardItem from './CardItem'
import ProAmmPoolListItem from './ListItem'

type PoolListProps = {
  currencies: { [field in Field]?: Currency }
  searchValue: string
  isShowOnlyActiveFarmPools: boolean
  onlyShowStable: boolean
}

const PageWrapper = styled.div`
  overflow: hidden;
  border-radius: 20px;
  background: ${({ theme }) => theme.background};

  ${PaginationInput} {
    background: ${({ theme }) => theme.background};
  }

  border: 1px solid ${({ theme }) => theme.border};
`

const TableHeader = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 2fr 1.25fr 1.25fr 1.25fr 1.25fr 1.25fr 1fr;
  padding: 16px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 1;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  `}
`

const ClickableText = styled(Text)`
  display: flex;
  align-items: center;
  color: ${({ theme }) => theme.subText};

  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }

  user-select: none;
  text-transform: uppercase;
`

const Grid = styled.div`
  padding: 24px;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  background: ${({ theme }) => theme.background};

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr 1fr;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 16px;
    grid-template-columns: 1fr;
  `};
`

enum SORT_FIELD {
  TVL = 'tvl',
  APR = 'apr',
  VOLUME = 'volume',
  FEE = 'fee',
  MY_LIQUIDITY = 'my_liquidity',
}

enum SORT_DIRECTION {
  ASC = 'asc',
  DESC = 'desc',
}

export default function ProAmmPoolList({
  currencies,
  searchValue,
  isShowOnlyActiveFarmPools,
  onlyShowStable,
}: PoolListProps) {
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  const [viewMode] = useViewMode()

  const { farms } = useElasticFarms()
  const allRewards = [
    ...new Set(
      farms
        ?.map(farm => farm.pools)
        .flat()
        .map(pool => pool.rewardTokens.map(rw => rw.wrapped.address.toLowerCase()))
        .flat() || [],
    ),
  ]
  const tokenPriceMap = useTokenPrices(allRewards)

  const totalFarmRewardUSDByPoolId = useMemo(
    () =>
      farms
        ?.map(farm => farm.pools)
        .flat()
        .filter(pool => pool.endTime > Date.now() / 1000)
        .map(pool => {
          const v = pool.totalRewards.reduce((acc, cur) => {
            return acc + Number(cur.toExact()) * tokenPriceMap[cur.currency.wrapped.address]
          }, 0)
          const farmDuration = (pool.endTime - pool.startTime) / 86400

          return {
            poolAddress: pool.poolAddress,
            value: (v * 365 * 100) / farmDuration,
          }
        })
        .reduce((acc, cur) => {
          return {
            ...acc,
            [cur.poolAddress]: cur.value,
          }
        }, {} as { [key: string]: number }) || {},

    [farms, tokenPriceMap],
  )

  const [searchParams, setSearchParams] = useSearchParams()
  const sortField = searchParams.get('orderBy') || SORT_FIELD.TVL
  const sortDirection = searchParams.get('orderDirection') || SORT_DIRECTION.DESC

  const caId = currencies[Field.CURRENCY_A]?.wrapped.address.toLowerCase()
  const cbId = currencies[Field.CURRENCY_B]?.wrapped.address.toLowerCase()

  const { loading, addresses } = useTopPoolAddresses()
  const { isLoading: poolDataLoading, data: poolDatas } = useGetElasticPools(addresses || [])

  const { chainId, account, isEVM, networkInfo } = useActiveWeb3React()
  const userLiquidityPositionsQueryResult = useUserProMMPositions()
  const loadingUserPositions = !account ? false : userLiquidityPositionsQueryResult.loading
  const userPositions = useMemo(
    () => (!account ? {} : userLiquidityPositionsQueryResult.userLiquidityUsdByPool),
    [account, userLiquidityPositionsQueryResult],
  )

  const isSortDesc = sortDirection === SORT_DIRECTION.DESC
  const listComparator = useCallback(
    (poolA: ElasticPoolDetail, poolB: ElasticPoolDetail): number => {
      switch (sortField) {
        case SORT_FIELD.TVL:
          return poolA.tvlUSD > poolB.tvlUSD ? (isSortDesc ? -1 : 1) * 1 : (isSortDesc ? -1 : 1) * -1
        case SORT_FIELD.VOLUME:
          return poolA.volumeUSDLast24h > poolB.volumeUSDLast24h
            ? (isSortDesc ? -1 : 1) * 1
            : (isSortDesc ? -1 : 1) * -1
        case SORT_FIELD.FEE:
          return poolA.volumeUSDLast24h * poolA.feeTier > poolB.volumeUSDLast24h * poolB.feeTier
            ? (isSortDesc ? -1 : 1) * 1
            : (isSortDesc ? -1 : 1) * -1
        case SORT_FIELD.APR:
          const a = poolA.apr + (poolA.farmAPR || 0)
          const b = poolB.apr + (poolB.farmAPR || 0)
          return a > b ? (isSortDesc ? -1 : 1) * 1 : (isSortDesc ? -1 : 1) * -1
        case SORT_FIELD.MY_LIQUIDITY:
          const t1 = userPositions[poolA.address] || 0
          const t2 = userPositions[poolB.address] || 0
          return (t1 - t2) * (isSortDesc ? -1 : 1)

        default:
          break
      }

      return 0
    },
    [isSortDesc, sortField, userPositions],
  )

  const anyLoading = loading || poolDataLoading || loadingUserPositions

  const filteredData = useMemo(() => {
    let filteredPools = Object.values(poolDatas || []).filter(
      pool =>
        pool.address.toLowerCase() === searchValue ||
        pool.token0.name.toLowerCase().includes(searchValue) ||
        pool.token0.symbol.toLowerCase().includes(searchValue) ||
        pool.token1.name.toLowerCase().includes(searchValue) ||
        pool.token1.symbol.toLowerCase().includes(searchValue),
    )

    if (isShowOnlyActiveFarmPools) {
      const activePoolFarmAddress =
        farms
          ?.map(farm => farm.pools)
          .flat()
          .filter(item => item.endTime > +new Date() / 1000)
          .map(item => item.poolAddress.toLowerCase()) || []
      filteredPools = filteredPools.filter(pool => activePoolFarmAddress.includes(pool.address.toLowerCase()))
    }

    if (caId && cbId && caId === cbId) filteredPools = []
    else {
      if (caId)
        filteredPools = filteredPools.filter(pool => pool.token0.address === caId || pool.token1.address === caId)
      if (cbId)
        filteredPools = filteredPools.filter(pool => pool.token0.address === cbId || pool.token1.address === cbId)
    }

    if (onlyShowStable) {
      const stableList = chainId ? STABLE_COINS_ADDRESS[chainId]?.map(item => item.toLowerCase()) || [] : []
      filteredPools = filteredPools.filter(poolData => {
        return (
          stableList.includes(poolData.token0.address.toLowerCase()) &&
          stableList.includes(poolData.token1.address.toLowerCase())
        )
      })
    }

    return filteredPools
      .map(p => {
        p.farmAPR = p.farmAPR ? p.farmAPR : (totalFarmRewardUSDByPoolId[p.address] || 0) / p.tvlUSD
        return p
      })
      .sort(listComparator)
  }, [
    poolDatas,
    totalFarmRewardUSDByPoolId,
    isShowOnlyActiveFarmPools,
    caId,
    cbId,
    onlyShowStable,
    searchValue,
    farms,
    chainId,
    listComparator,
  ])

  const handleSort = (field: SORT_FIELD) => {
    const direction =
      sortField !== field
        ? SORT_DIRECTION.DESC
        : sortDirection === SORT_DIRECTION.DESC
        ? SORT_DIRECTION.ASC
        : SORT_DIRECTION.DESC

    searchParams.set('orderDirection', direction)
    searchParams.set('orderBy', field)
    setSearchParams(searchParams)
  }

  const renderHeader = () => {
    return viewMode === VIEW_MODE.LIST && !upToMedium ? (
      <TableHeader>
        <Flex alignItems="center">
          <ClickableText>
            <Trans>Token Pair | Fee</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }} onClick={() => handleSort(SORT_FIELD.TVL)}>
            <span>TVL</span>
            {sortField === SORT_FIELD.TVL ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => handleSort(SORT_FIELD.APR)}
            style={{
              paddingRight: '20px', // leave some space for the money bag in the value rows
            }}
          >
            <Trans>APR</Trans>
            {sortField === SORT_FIELD.APR ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}

            <InfoHelper
              text={t`Average estimated return based on yearly trading fees from the pool & additional bonus rewards if you participate in the farm`}
            />
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.VOLUME)}>
            <Trans>VOLUME (24H)</Trans>
            {sortField === SORT_FIELD.VOLUME ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.FEE)}>
            <Trans>FEES (24H)</Trans>
            {sortField === SORT_FIELD.FEE ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.MY_LIQUIDITY)}>
            <Trans>MY LIQUIDITY</Trans>
            {sortField === SORT_FIELD.MY_LIQUIDITY ? (
              !isSortDesc ? (
                <ArrowUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ArrowDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>ACTIONS</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  const ITEM_PER_PAGE = 12
  const [page, setPage] = useState(1)
  useEffect(() => {
    setPage(1)
  }, [chainId, currencies, searchValue, onlyShowStable])

  const [sharedPoolId, setSharedPoolId] = useState('')
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const chainRoute = networkInfo.route
  const shareUrl = sharedPoolId
    ? window.location.origin + `/pools/${chainRoute}?search=` + sharedPoolId + '&tab=elastic'
    : undefined

  useEffect(() => {
    if (sharedPoolId) {
      openShareModal()
    }
  }, [openShareModal, sharedPoolId])

  useEffect(() => {
    if (!isShareModalOpen) {
      setSharedPoolId('')
    }
  }, [isShareModalOpen, setSharedPoolId])

  if (!isEVM) return <Navigate to="/" />

  const pageData = filteredData.slice((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE)

  if (!anyLoading && !filteredData.length) {
    return (
      <SelectPairInstructionWrapper>
        <div style={{ marginBottom: '1rem' }}>
          <Trans>There are no pools for this token pair.</Trans>
        </div>
        <div>
          <Trans>Create a new pool or select another pair of tokens to view the available pools.</Trans>
        </div>
      </SelectPairInstructionWrapper>
    )
  }

  return (
    <PageWrapper>
      {renderHeader()}
      {anyLoading && !filteredData.length && <LocalLoader />}
      {viewMode === VIEW_MODE.LIST && !upToMedium ? (
        pageData.map(p => (
          <ProAmmPoolListItem key={p.address} pool={p} onShared={setSharedPoolId} userPositions={userPositions} />
        ))
      ) : (
        <Grid>
          {pageData.map(p => (
            <ProAmmPoolCardItem key={p.address} pool={p} onShared={setSharedPoolId} userPositions={userPositions} />
          ))}
        </Grid>
      )}
      {!!filteredData.length && (
        <Pagination
          onPageChange={setPage}
          totalCount={filteredData.length}
          currentPage={page}
          pageSize={ITEM_PER_PAGE}
        />
      )}
      <ShareModal
        url={shareUrl}
        title={sharedPoolId ? t`Share this pool with your friends!` : t`Share this list of pools with your friends`}
      />
      <FarmUpdater interval={false} />
    </PageWrapper>
  )
}
