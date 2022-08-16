import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex } from 'rebass'
import styled from 'styled-components'

import InfoHelper from 'components/InfoHelper'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import { Input as PaginationInput } from 'components/Pagination/PaginationInputOnMobile'
import ItemCardGroup from 'components/PoolList/ItemCard/ItemCardGroup'
import ListItem from 'components/PoolList/ListItem'
import ShareModal from 'components/ShareModal'
import { ClickableText } from 'components/YieldPools/styleds'
import { AMP_HINT, AMP_LIQUIDITY_HINT, MAX_ALLOW_APY } from 'constants/index'
import { STABLE_COINS_ADDRESS } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'
import { SelectPairInstructionWrapper } from 'pages/Pools/styleds'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useOpenModal } from 'state/application/hooks'
import { useActiveAndUniqueFarmsData } from 'state/farms/hooks'
import { Field } from 'state/pair/actions'
import {
  SubgraphPoolData,
  UserLiquidityPosition,
  useAllPoolsData,
  useResetPools,
  useSharedPoolIdManager,
  useUserLiquidityPositions,
} from 'state/pools/hooks'
import { getTradingFeeAPR } from 'utils/dmm'

import PoolDetailModal from './PoolDetailModal'

const PageWrapper = styled.div`
  overflow: 'hidden';
  &[data-above1000='true'] {
    background: ${({ theme }) => theme.background};
    border-radius: 20px;
  }

  ${PaginationInput} {
    background: ${({ theme }) => theme.background};
  }
`

const TableHeader = styled.div`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1.5fr 2fr 0.75fr 1fr 1fr 1fr 1.5fr;
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

interface PoolListProps {
  currencies: { [field in Field]?: Currency }
  searchValue: string
  isShowOnlyActiveFarmPools: boolean
  onlyShowStable: boolean
  shouldShowLowTVLPools: boolean
}

const SORT_FIELD = {
  LIQ: 0,
  VOL: 1,
  FEES: 2,
  APR: 3,
}

const ITEM_PER_PAGE = 8

const PoolList = ({
  currencies,
  searchValue,
  isShowOnlyActiveFarmPools,
  onlyShowStable,
  shouldShowLowTVLPools,
}: PoolListProps) => {
  const above1000 = useMedia('(min-width: 1000px)')

  const [sortDirection, setSortDirection] = useState(true)
  const [sortedColumn, setSortedColumn] = useState(SORT_FIELD.LIQ)
  const { loading: loadingPoolsData, data: subgraphPoolsData } = useAllPoolsData()

  const { account, chainId } = useActiveWeb3React()

  useResetPools(chainId)

  const userLiquidityPositionsQueryResult = useUserLiquidityPositions(account)
  const loadingUserLiquidityPositions = !account ? false : userLiquidityPositionsQueryResult.loading
  const userLiquidityPositions = !account ? { liquidityPositions: [] } : userLiquidityPositionsQueryResult.data
  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}
  userLiquidityPositions &&
    userLiquidityPositions.liquidityPositions.forEach(position => {
      transformedUserLiquidityPositions[position.pool.id] = position
    })

  const listComparator = useCallback(
    (poolA: SubgraphPoolData, poolB: SubgraphPoolData): number => {
      const feeA = poolA?.oneDayFeeUSD ? poolA?.oneDayFeeUSD : poolA?.oneDayFeeUntracked
      const feeB = poolB?.oneDayFeeUSD ? poolB?.oneDayFeeUSD : poolB?.oneDayFeeUntracked

      switch (sortedColumn) {
        case SORT_FIELD.LIQ:
          return parseFloat(poolA?.amp.toString() || '0') * parseFloat(poolA?.reserveUSD) >
            parseFloat(poolB?.amp.toString() || '0') * parseFloat(poolB?.reserveUSD)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.VOL:
          const volumeA = poolA?.oneDayVolumeUSD ? poolA?.oneDayVolumeUSD : poolA?.oneDayVolumeUntracked

          const volumeB = poolB?.oneDayVolumeUSD ? poolB?.oneDayVolumeUSD : poolB?.oneDayVolumeUntracked

          return parseFloat(volumeA) > parseFloat(volumeB)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.FEES:
          return parseFloat(feeA) > parseFloat(feeB) ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.APR:
          const oneYearFLPoolA =
            getTradingFeeAPR(poolA?.reserveUSD, feeA) > MAX_ALLOW_APY ? -1 : getTradingFeeAPR(poolA?.reserveUSD, feeA)
          const oneYearFLPoolB =
            getTradingFeeAPR(poolB?.reserveUSD, feeB) > MAX_ALLOW_APY ? -1 : getTradingFeeAPR(poolB?.reserveUSD, feeB)

          return oneYearFLPoolA > oneYearFLPoolB ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        default:
          break
      }

      return 0
    },
    [sortDirection, sortedColumn],
  )

  const renderHeader = () => {
    return above1000 ? (
      <TableHeader>
        <Flex alignItems="center">
          <ClickableText>
            <Trans>Token Pair</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center">
          <ClickableText>
            <Trans>Pool | AMP</Trans>
          </ClickableText>
          <InfoHelper text={AMP_HINT} />
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.LIQ)
              setSortDirection(sortedColumn !== SORT_FIELD.LIQ ? true : !sortDirection)
            }}
            style={{ textAlign: 'right' }}
          >
            <Trans>AMP LIQUIDITY</Trans>
            <InfoHelper text={AMP_LIQUIDITY_HINT} />
            <span style={{ marginLeft: '0.25rem' }}>|</span>
            <span style={{ marginLeft: '0.25rem' }}>TVL</span>
            {sortedColumn === SORT_FIELD.LIQ ? (
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
              setSortedColumn(SORT_FIELD.APR)
              setSortDirection(sortedColumn !== SORT_FIELD.APR ? true : !sortDirection)
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
              setSortedColumn(SORT_FIELD.VOL)
              setSortDirection(sortedColumn !== SORT_FIELD.VOL ? true : !sortDirection)
            }}
            style={{ textAlign: 'right' }}
          >
            <Trans>Volume (24h)</Trans>
            {sortedColumn === SORT_FIELD.VOL ? (
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
              setSortedColumn(SORT_FIELD.FEES)
              setSortDirection(sortedColumn !== SORT_FIELD.FEES ? true : !sortDirection)
            }}
          >
            <Trans>Fee (24h)</Trans>
            {sortedColumn === SORT_FIELD.FEES ? (
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
          <ClickableText style={{ textAlign: 'right' }}>
            <Trans>My liquidity</Trans>
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

  const sortedFilteredSubgraphPoolsData = useMemo(() => {
    let res = [...subgraphPoolsData].sort(listComparator)

    if (isShowOnlyActiveFarmPools) {
      const farmAddresses = farms.map(farm => farm.id)
      res = res.filter(poolData => farmAddresses.includes(poolData.id))
    }

    if (!shouldShowLowTVLPools) {
      res = res.filter(poolData => parseFloat(poolData.reserveUSD) > 1)
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
      const stableList = chainId ? STABLE_COINS_ADDRESS[chainId]?.map(item => item.toLowerCase()) || [] : []
      res = res.filter(poolData => {
        return (
          stableList.includes(poolData.token0.id.toLowerCase()) && stableList.includes(poolData.token1.id.toLowerCase())
        )
      })
    }

    return res
  }, [
    subgraphPoolsData,
    listComparator,
    isShowOnlyActiveFarmPools,
    shouldShowLowTVLPools,
    currencies,
    onlyShowStable,
    farms,
    searchValue,
    chainId,
  ])

  const [currentPage, setCurrentPage] = useState(1)
  useEffect(() => {
    setCurrentPage(1)
  }, [subgraphPoolsData, currencies, searchValue, isShowOnlyActiveFarmPools, onlyShowStable])

  const sortedFilteredSubgraphPoolsObject = useMemo(() => {
    const res = new Map<string, SubgraphPoolData[]>()
    sortedFilteredSubgraphPoolsData.forEach(poolData => {
      if (!poolData) return
      const poolKey = poolData.token0.id + '-' + poolData.token1.id
      const prevValue = res.get(poolKey)
      res.set(poolKey, (prevValue ?? []).concat(poolData))
    })
    return res
  }, [sortedFilteredSubgraphPoolsData])

  const sortedFilteredPaginatedSubgraphPoolsList = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEM_PER_PAGE
    const endIndex = currentPage * ITEM_PER_PAGE
    const res = Array.from(sortedFilteredSubgraphPoolsObject, ([, pools]) => pools[0]).slice(startIndex, endIndex)
    return res
  }, [currentPage, sortedFilteredSubgraphPoolsObject])

  const [expandedPoolKey, setExpandedPoolKey] = useState<string>()

  // Active first expandable pool in first page for first time.
  useEffect(() => {
    if (!above1000 || expandedPoolKey !== undefined) return

    const firstPoolHasMoreThanTwoExpandedPools = sortedFilteredPaginatedSubgraphPoolsList.filter(poolData => {
      const poolKey = poolData.token0.id + '-' + poolData.token1.id

      const expandedPools = sortedFilteredSubgraphPoolsObject.get(poolKey) ?? []

      return expandedPools.length >= 2
    })

    firstPoolHasMoreThanTwoExpandedPools.length &&
      setExpandedPoolKey(
        firstPoolHasMoreThanTwoExpandedPools[0].token0.id + '-' + firstPoolHasMoreThanTwoExpandedPools[0].token1.id,
      )
  }, [above1000, sortedFilteredPaginatedSubgraphPoolsList, expandedPoolKey, sortedFilteredSubgraphPoolsObject])

  const [sharedPoolId, setSharedPoolId] = useSharedPoolIdManager()
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)
  const shareUrl = sharedPoolId
    ? window.location.origin + '/pools?search=' + sharedPoolId + '&networkId=' + chainId
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

  if (sortedFilteredPaginatedSubgraphPoolsList.length === 0)
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
      {sortedFilteredPaginatedSubgraphPoolsList.map(poolData => {
        if (poolData) {
          return above1000 ? (
            <ListItem
              key={poolData.id}
              sortedFilteredSubgraphPoolsObject={sortedFilteredSubgraphPoolsObject}
              poolData={poolData}
              userLiquidityPositions={transformedUserLiquidityPositions}
              expandedPoolKey={expandedPoolKey}
              setExpandedPoolKey={setExpandedPoolKey}
            />
          ) : (
            <ItemCardGroup
              key={poolData.id}
              sortedFilteredSubgraphPoolsObject={sortedFilteredSubgraphPoolsObject}
              poolData={poolData}
              userLiquidityPositions={transformedUserLiquidityPositions}
              expandedPoolKey={expandedPoolKey}
              setExpandedPoolKey={setExpandedPoolKey}
            />
          )
        }

        return null
      })}
      <Pagination
        pageSize={ITEM_PER_PAGE}
        onPageChange={newPage => setCurrentPage(newPage)}
        currentPage={currentPage}
        totalCount={sortedFilteredSubgraphPoolsObject.size}
        haveBg={above1000}
      />
      <PoolDetailModal />
      <ShareModal url={shareUrl} />
    </PageWrapper>
  )
}

export default PoolList
