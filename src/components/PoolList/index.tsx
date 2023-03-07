import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDown as ChevronDown, ArrowUp as ChevronUp } from 'react-feather'
import { useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { Input as PaginationInput } from 'components/Pagination/PaginationInputOnMobile'
import ListItem from 'components/PoolList/ListItem'
import ShareModal from 'components/ShareModal'
import { ClickableText } from 'components/YieldPools/styleds'
import { AMP_HINT, AMP_LIQUIDITY_HINT, MAX_ALLOW_APY } from 'constants/index'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { SelectPairInstructionWrapper } from 'pages/Pools/styleds'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { useActiveAndUniqueFarmsData } from 'state/farms/classic/hooks'
import { Field } from 'state/pair/actions'
import {
  SubgraphPoolData,
  UserLiquidityPosition,
  useAllPoolsData,
  useResetPools,
  useSharedPoolIdManager,
  useUserLiquidityPositions,
} from 'state/pools/hooks'
import { useViewMode } from 'state/user/hooks'
import { VIEW_MODE } from 'state/user/reducer'
import { getTradingFeeAPR } from 'utils/dmm'

import ItemCard from './ItemCard'
import PoolDetailModal from './PoolDetailModal'

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
  grid-gap: 1.5rem;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 1fr 1fr;
  padding: 16px 20px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  z-index: 1;
  border-bottom: ${({ theme }) => `1px solid ${theme.border}`};
  text-align: right;
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

interface PoolListProps {
  currencies: { [field in Field]?: Currency }
  searchValue: string
  isShowOnlyActiveFarmPools: boolean
  onlyShowStable: boolean
}

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

const ITEM_PER_PAGE = 12

const PoolList = ({ currencies, searchValue, isShowOnlyActiveFarmPools, onlyShowStable }: PoolListProps) => {
  const above1000 = useMedia('(min-width: 1000px)')

  const { loading: loadingPoolsData, data: subgraphPoolsData } = useAllPoolsData()

  const { account, chainId, networkInfo, isEVM } = useActiveWeb3React()
  const [viewMode] = useViewMode()

  useResetPools(chainId)

  const userLiquidityPositionsQueryResult = useUserLiquidityPositions()
  const loadingUserLiquidityPositions = !account ? false : userLiquidityPositionsQueryResult.loading
  const userLiquidityPositions = useMemo(
    () => (!account ? { liquidityPositions: [] } : userLiquidityPositionsQueryResult.data),
    [account, userLiquidityPositionsQueryResult],
  )

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = useMemo(() => {
    if (!userLiquidityPositions) return {}

    return userLiquidityPositions.liquidityPositions.reduce((acc, position) => {
      acc[position.pool.id] = position
      return acc
    }, {} as { [key: string]: UserLiquidityPosition })
  }, [userLiquidityPositions])

  const [searchParams, setSearchParams] = useSearchParams()
  const sortedColumn = searchParams.get('orderBy') || SORT_FIELD.TVL
  const sortOrder = searchParams.get('orderDirection') || SORT_DIRECTION.DESC

  const sortDirection = sortOrder === SORT_DIRECTION.DESC

  const listComparator = useCallback(
    (poolA: SubgraphPoolData, poolB: SubgraphPoolData): number => {
      const feeA = poolA?.oneDayFeeUSD ? poolA?.oneDayFeeUSD : poolA?.oneDayFeeUntracked
      const feeB = poolB?.oneDayFeeUSD ? poolB?.oneDayFeeUSD : poolB?.oneDayFeeUntracked
      const a = transformedUserLiquidityPositions[poolA.id]
      const b = transformedUserLiquidityPositions[poolB.id]
      const t1 = a ? (+a.liquidityTokenBalance * +a.pool.reserveUSD) / +a.pool.totalSupply : 0
      const t2 = b ? (+b.liquidityTokenBalance * +b.pool.reserveUSD) / +b.pool.totalSupply : 0

      switch (sortedColumn) {
        case SORT_FIELD.MY_LIQUIDITY:
          return (t1 - t2) * (sortDirection ? -1 : 1)

        case SORT_FIELD.TVL:
          return parseFloat(poolA?.amp?.toString() || '0') * parseFloat(poolA?.reserveUSD) >
            parseFloat(poolB?.amp?.toString() || '0') * parseFloat(poolB?.reserveUSD)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.VOLUME:
          const volumeA = poolA?.oneDayVolumeUSD ? poolA?.oneDayVolumeUSD : poolA?.oneDayVolumeUntracked

          const volumeB = poolB?.oneDayVolumeUSD ? poolB?.oneDayVolumeUSD : poolB?.oneDayVolumeUntracked

          return parseFloat(volumeA) > parseFloat(volumeB)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.FEE:
          return parseFloat(feeA) > parseFloat(feeB) ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.APR:
          const oneYearFLPoolA =
            getTradingFeeAPR(poolA?.reserveUSD, feeA) > MAX_ALLOW_APY ? -1 : getTradingFeeAPR(poolA?.reserveUSD, feeA)
          const oneYearFLPoolB =
            getTradingFeeAPR(poolB?.reserveUSD, feeB) > MAX_ALLOW_APY ? -1 : getTradingFeeAPR(poolB?.reserveUSD, feeB)

          return oneYearFLPoolA > oneYearFLPoolB ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1

        default:
          return 0
      }
    },
    [sortDirection, sortedColumn, transformedUserLiquidityPositions],
  )

  const handleSort = (field: SORT_FIELD) => {
    const direction =
      sortedColumn !== field
        ? SORT_DIRECTION.DESC
        : sortOrder === SORT_DIRECTION.DESC
        ? SORT_DIRECTION.ASC
        : SORT_DIRECTION.DESC

    searchParams.set('orderDirection', direction)
    searchParams.set('orderBy', field)
    setSearchParams(searchParams)
  }

  const renderHeader = () => {
    return viewMode === VIEW_MODE.LIST && above1000 ? (
      <TableHeader>
        <Flex alignItems="center">
          <ClickableText>
            <Trans>Pool | AMP</Trans>
          </ClickableText>
          <InfoHelper text={AMP_HINT} />
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText onClick={() => handleSort(SORT_FIELD.TVL)} style={{ textAlign: 'right' }}>
            <Trans>AMP LIQUIDITY</Trans>
            <InfoHelper text={AMP_LIQUIDITY_HINT} />
            <span style={{ marginLeft: '0.25rem' }}>|</span>
            <span style={{ marginLeft: '0.25rem' }}>TVL</span>
            {sortedColumn === SORT_FIELD.TVL ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex
          alignItems="center"
          justifyContent="flex-end"
          sx={{
            paddingRight: '20px', // to make the money bag icon in the cells vertically align
          }}
        >
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.APR)
            }}
          >
            <Trans>APR</Trans>
            {sortedColumn === SORT_FIELD.APR ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
          <InfoHelper text={t`Estimated return based on yearly fees of the pool`} />
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.VOLUME)
            }}
            style={{ textAlign: 'right' }}
          >
            <Trans>Volume (24h)</Trans>
            {sortedColumn === SORT_FIELD.VOLUME ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => {
              handleSort(SORT_FIELD.FEE)
            }}
          >
            <Trans>Fees (24h)</Trans>
            {sortedColumn === SORT_FIELD.FEE ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText style={{ textAlign: 'right' }} onClick={() => handleSort(SORT_FIELD.MY_LIQUIDITY)}>
            <Trans>My liquidity</Trans>
            {sortedColumn === SORT_FIELD.MY_LIQUIDITY ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText>
            <Trans>Actions</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  const { data: farms } = useActiveAndUniqueFarmsData()

  const [currentPage, setCurrentPage] = useState(1)
  const sortedFilteredSubgraphPoolsData = useMemo(() => {
    let res = [...subgraphPoolsData]

    if (isShowOnlyActiveFarmPools) {
      const farmAddresses = farms.map(farm => farm.id)
      res = res.filter(poolData => farmAddresses.includes(poolData.id))
    }

    const ca = currencies[Field.CURRENCY_A]
    const cb = currencies[Field.CURRENCY_B]

    if (ca) {
      const wca = ca.wrapped
      const wcaAddress = wca && wca.address.toLowerCase()
      res = res.filter(
        poolData => wcaAddress && (poolData.token0.id === wcaAddress || poolData.token1.id === wcaAddress),
      )
    }

    if (cb) {
      const wcb = cb.wrapped
      const wcbAddress = wcb && wcb.address.toLowerCase()
      res = res.filter(
        poolData => wcbAddress && (poolData.token0.id === wcbAddress || poolData.token1.id === wcbAddress),
      )
    }

    res = res.filter(poolData => {
      const search = searchValue.toLowerCase()

      return (
        poolData.token0.symbol.toLowerCase().includes(search) ||
        poolData.token1.symbol.toLowerCase().includes(search) ||
        poolData.id.includes(search)
      )
    })

    if (onlyShowStable) {
      const stableList = isEVM ? STABLE_COINS_ADDRESS[chainId]?.map(item => item.toLowerCase()) || [] : []
      res = res.filter(poolData => {
        return (
          stableList.includes(poolData.token0.id.toLowerCase()) && stableList.includes(poolData.token1.id.toLowerCase())
        )
      })
    }

    return res.sort(listComparator)
  }, [
    subgraphPoolsData,
    listComparator,
    isShowOnlyActiveFarmPools,
    currencies,
    onlyShowStable,
    farms,
    searchValue,
    chainId,
    isEVM,
  ])

  const startIndex = (currentPage - 1) * ITEM_PER_PAGE
  const endIndex = currentPage * ITEM_PER_PAGE
  const pageData = sortedFilteredSubgraphPoolsData.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [chainId, subgraphPoolsData, currencies, searchValue, isShowOnlyActiveFarmPools, onlyShowStable])

  const [sharedPoolId, setSharedPoolId] = useSharedPoolIdManager()
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const chainRoute = networkInfo.route
  const shareUrl = sharedPoolId
    ? window.location.origin + `/pools/${chainRoute}?tab=classic&search=` + sharedPoolId
    : undefined

  useEffect(() => {
    if (sharedPoolId) {
      openShareModal()
    }
  }, [openShareModal, sharedPoolId])

  useEffect(() => {
    if (!isShareModalOpen) {
      setSharedPoolId(undefined)
    }
  }, [isShareModalOpen, setSharedPoolId])

  if (loadingUserLiquidityPositions || loadingPoolsData) return <LocalLoader />

  if (sortedFilteredSubgraphPoolsData.length === 0)
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

  return (
    <PageWrapper data-above1000={above1000}>
      {renderHeader()}
      {viewMode === VIEW_MODE.LIST && above1000 ? (
        pageData.map(poolData => {
          if (poolData) {
            return (
              <ListItem
                key={poolData.id}
                poolData={poolData}
                userLiquidityPositions={transformedUserLiquidityPositions}
              />
            )
          }

          return null
        })
      ) : (
        <Grid>
          {pageData.map(item => (
            <ItemCard poolData={item} key={item.id} myLiquidity={transformedUserLiquidityPositions[item.id]} />
          ))}
        </Grid>
      )}
      <Pagination
        pageSize={ITEM_PER_PAGE}
        onPageChange={newPage => setCurrentPage(newPage)}
        currentPage={currentPage}
        totalCount={sortedFilteredSubgraphPoolsData.length}
        haveBg={above1000}
      />
      <PoolDetailModal />
      <ShareModal url={shareUrl} title={t`Share this pool with your friends!`} />
    </PageWrapper>
  )
}

export default PoolList
