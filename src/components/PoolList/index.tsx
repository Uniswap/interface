import React, { useState, useEffect, useMemo, useCallback } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { Pair } from '@dynamic-amm/sdk'
import { ChevronUp, ChevronDown } from 'react-feather'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'

import { ButtonEmpty } from 'components/Button'
import InfoHelper from 'components/InfoHelper'
import { SubgraphPoolData, UserLiquidityPosition } from 'state/pools/hooks'
import { getHealthFactor, getTradingFeeAPR } from 'utils/dmm'
import ListItem, { ItemCard } from './ListItem'
import PoolDetailModal from './PoolDetailModal'
import { AMP_HINT } from 'constants/index'

const TableHeader = styled.div<{ fade?: boolean; oddRow?: boolean }>`
  display: grid;
  grid-gap: 1.5rem;
  grid-template-columns: 1.5fr 1fr 2fr 1.5fr repeat(3, 1fr) 1fr;
  grid-template-areas: 'pool ratio liq vol';
  padding: 15px 36px 13px 26px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  opacity: ${({ fade }) => (fade ? '0.6' : '1')};
  background-color: ${({ theme }) => theme.evenRow};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
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

const LoadMoreButtonContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  background-color: ${({ theme }) => theme.background};
  font-size: 12px;
  border-bottom-left-radius: 8px;
  border-bottom-right-radius: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-radius: 8px;
  `};
`

interface PoolListProps {
  poolsList: (Pair | null)[]
  subgraphPoolsData?: SubgraphPoolData[]
  userLiquidityPositions?: UserLiquidityPosition[]
  maxItems?: number
}

const SORT_FIELD = {
  NONE: -1,
  LIQ: 0,
  VOL: 1,
  FEES: 2,
  ONE_YEAR_FL: 3
}

const PoolList = ({ poolsList, subgraphPoolsData, userLiquidityPositions, maxItems = 10 }: PoolListProps) => {
  const above1000 = useMedia('(min-width: 1000px)')

  const transformedUserLiquidityPositions: {
    [key: string]: UserLiquidityPosition
  } = {}

  const transformedSubgraphPoolsData: {
    [key: string]: SubgraphPoolData
  } = useMemo(() => {
    return (subgraphPoolsData || []).reduce((acc, data) => {
      return {
        ...acc,
        [data.id]: data
      }
    }, {})
  }, [subgraphPoolsData])

  userLiquidityPositions &&
    userLiquidityPositions.forEach(position => {
      transformedUserLiquidityPositions[position.pool.id] = position
    })

  // pagination
  const [page, setPage] = useState(1)
  const [maxPage, setMaxPage] = useState(1)
  const ITEMS_PER_PAGE = maxItems

  // sorting
  const [sortDirection, setSortDirection] = useState(true)
  const [sortedColumn, setSortedColumn] = useState(SORT_FIELD.NONE)

  const sortList = useCallback(
    (poolA: Pair | null, poolB: Pair | null): number => {
      if (sortedColumn === SORT_FIELD.NONE) {
        if (!poolA) {
          return 1
        }

        if (!poolB) {
          return -1
        }

        const poolAHealthFactor = getHealthFactor(poolA)
        const poolBHealthFactor = getHealthFactor(poolB)

        // Pool with better health factor will be prioritized higher
        if (poolAHealthFactor.greaterThan(poolBHealthFactor)) {
          return -1
        }

        if (poolAHealthFactor.lessThan(poolBHealthFactor)) {
          return 1
        }

        return 0
      }

      const poolASubgraphData = transformedSubgraphPoolsData[(poolA as Pair).address.toLowerCase()]
      const poolBSubgraphData = transformedSubgraphPoolsData[(poolB as Pair).address.toLowerCase()]

      const feeA = poolASubgraphData?.oneDayFeeUSD
        ? poolASubgraphData?.oneDayFeeUSD
        : poolASubgraphData?.oneDayFeeUntracked

      const feeB = poolBSubgraphData?.oneDayFeeUSD
        ? poolBSubgraphData?.oneDayFeeUSD
        : poolBSubgraphData?.oneDayFeeUntracked

      switch (sortedColumn) {
        case SORT_FIELD.LIQ:
          return parseFloat(poolA?.amp.toString() || '0') * parseFloat(poolASubgraphData?.reserveUSD) >
            parseFloat(poolB?.amp.toString() || '0') * parseFloat(poolBSubgraphData?.reserveUSD)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.VOL:
          const volumeA = poolASubgraphData?.oneDayVolumeUSD
            ? poolASubgraphData?.oneDayVolumeUSD
            : poolASubgraphData?.oneDayVolumeUntracked

          const volumeB = poolBSubgraphData?.oneDayVolumeUSD
            ? poolBSubgraphData?.oneDayVolumeUSD
            : poolBSubgraphData?.oneDayVolumeUntracked

          return parseFloat(volumeA) > parseFloat(volumeB)
            ? (sortDirection ? -1 : 1) * 1
            : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.FEES:
          return parseFloat(feeA) > parseFloat(feeB) ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.ONE_YEAR_FL:
          const oneYearFLPoolA = getTradingFeeAPR(poolASubgraphData?.reserveUSD, feeA)
          const oneYearFLPoolB = getTradingFeeAPR(poolBSubgraphData?.reserveUSD, feeB)

          return oneYearFLPoolA > oneYearFLPoolB ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        default:
          break
      }

      return 0
    },
    [sortDirection, sortedColumn, transformedSubgraphPoolsData]
  )

  const renderHeader = () => {
    return above1000 ? (
      <TableHeader>
        <Flex alignItems="center" justifyContent="flexStart">
          <ClickableText>
            <Trans>Pool</Trans>
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <Trans>AMP</Trans>
          </ClickableText>
          <InfoHelper text={AMP_HINT} />
        </Flex>
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.LIQ)
              setSortDirection(sortedColumn !== SORT_FIELD.LIQ ? true : !sortDirection)
            }}
          >
            <Trans>AMP Liquidity</Trans>
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
          <InfoHelper
            text={t`AMP factor x Liquidity in the pool. Amplified pools have higher capital efficiency and liquidity.`}
          />
        </Flex>
        <Flex alignItems="center">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.VOL)
              setSortDirection(sortedColumn !== SORT_FIELD.VOL ? true : !sortDirection)
            }}
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
        {/* <Flex alignItems="center" justifyContent="flexEnd">
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
        </Flex> */}
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.ONE_YEAR_FL)
              setSortDirection(sortedColumn !== SORT_FIELD.ONE_YEAR_FL ? true : !sortDirection)
            }}
          >
            <Trans>APR</Trans>
            {sortedColumn === SORT_FIELD.ONE_YEAR_FL ? (
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
        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <Trans>Ratio</Trans>
          </ClickableText>
          <InfoHelper
            text={t`Current token pair ratio of the pool. Ratio changes depending on pool trades. Add liquidity according to this ratio.`}
          />
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <Trans>My liquidity</Trans>
          </ClickableText>
        </Flex>

        <Flex alignItems="center" justifyContent="flexEnd">
          <ClickableText>
            <Trans>Add liquidity</Trans>
          </ClickableText>
        </Flex>
      </TableHeader>
    ) : null
  }

  const pools = useMemo(() => {
    return poolsList
      .map(pair => pair) // Clone to a new array to prevent "in-place" sort that mutate the poolsList
      .sort(sortList)
  }, [poolsList, sortList])

  useEffect(() => {
    if (page > maxPage) setPage(maxPage)
  }, [maxPage, page])

  useEffect(() => {
    if (poolsList) {
      let extraPages = 1
      if (Object.keys(poolsList).length % ITEMS_PER_PAGE === 0) {
        extraPages = 0
      }
      setMaxPage(Math.floor(Object.keys(poolsList).length / ITEMS_PER_PAGE) + extraPages)
    }
  }, [ITEMS_PER_PAGE, poolsList])

  return (
    <div>
      {renderHeader()}
      {pools.slice(0, page * ITEMS_PER_PAGE).map((pool, index) => {
        if (pool) {
          return above1000 ? (
            <ListItem
              key={pool.address}
              pool={pool}
              subgraphPoolData={transformedSubgraphPoolsData[pool.address.toLowerCase()]}
              myLiquidity={transformedUserLiquidityPositions[pool.address.toLowerCase()]}
              oddRow={(index + 1) % 2 !== 0}
            />
          ) : (
            <ItemCard
              key={pool.address}
              pool={pool}
              subgraphPoolData={transformedSubgraphPoolsData[pool.address.toLowerCase()]}
              myLiquidity={transformedUserLiquidityPositions[pool.address.toLowerCase()]}
              oddRow={(index + 1) % 2 !== 0}
            />
          )
        }

        return null
      })}
      <LoadMoreButtonContainer>
        <ButtonEmpty
          onClick={() => {
            setPage(page === maxPage ? page : page + 1)
          }}
          disabled={page >= maxPage}
        >
          <Trans>Show More Pools</Trans>
        </ButtonEmpty>
      </LoadMoreButtonContainer>
      <PoolDetailModal />
    </div>
  )
}

export default PoolList
