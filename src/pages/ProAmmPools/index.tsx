import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { DividerDash } from 'components/Divider'
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
import { useProMMFarms } from 'state/farms/promm/hooks'
import { Field } from 'state/mint/proamm/actions'
import { ProMMPoolData, usePoolDatas, useTopPoolAddresses, useUserProMMPositions } from 'state/prommPools/hooks'

import ProAmmPoolCardItem from './CardItem'
import ProAmmPoolListItem from './ListItem'

type PoolListProps = {
  currencies: { [field in Field]?: Currency }
  searchValue: string
  isShowOnlyActiveFarmPools: boolean
  onlyShowStable: boolean
}

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
  grid-gap: 1rem;
  grid-template-columns: 1.5fr 1.5fr 1.5fr 0.75fr 1fr 1fr 1.2fr 1.5fr;
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

const SORT_FIELD = {
  TVL: 0,
  VOL: 1,
  FEES: 2,
  APR: 3,
}

export default function ProAmmPoolList({
  currencies,
  searchValue,
  isShowOnlyActiveFarmPools,
  onlyShowStable,
}: PoolListProps) {
  const above1000 = useMedia('(min-width: 1000px)')

  const { data: farms } = useProMMFarms()

  const [sortDirection, setSortDirection] = useState(true)
  const [sortedColumn, setSortedColumn] = useState(SORT_FIELD.TVL)

  const caId = currencies[Field.CURRENCY_A]?.wrapped.address.toLowerCase()
  const cbId = currencies[Field.CURRENCY_B]?.wrapped.address.toLowerCase()

  const { loading, addresses } = useTopPoolAddresses()
  const { loading: poolDataLoading, data: poolDatas } = usePoolDatas(addresses || [])

  const { chainId, account } = useActiveWeb3React()
  const userLiquidityPositionsQueryResult = useUserProMMPositions()
  const loadingUserPositions = !account ? false : userLiquidityPositionsQueryResult.loading
  const userPositions = !account ? {} : userLiquidityPositionsQueryResult.userLiquidityUsdByPool
  const listComparator = useCallback(
    (poolA: ProMMPoolData, poolB: ProMMPoolData): number => {
      switch (sortedColumn) {
        case SORT_FIELD.TVL:
          return poolA.tvlUSD > poolB.tvlUSD ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.VOL:
          return poolA.volumeUSD > poolB.volumeUSD ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.FEES:
          return poolA.volumeUSD > poolB.volumeUSD ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        case SORT_FIELD.APR:
          const a = poolA.apr
          const b = poolB.apr
          return a > b ? (sortDirection ? -1 : 1) * 1 : (sortDirection ? -1 : 1) * -1
        default:
          break
      }

      return 0
    },
    [sortDirection, sortedColumn],
  )

  const anyLoading = loading || poolDataLoading || loadingUserPositions
  const pairDatas = useMemo(() => {
    const initPairs: { [pairId: string]: ProMMPoolData[] } = {}

    let filteredPools = Object.values(poolDatas || []).filter(
      pool =>
        pool.address.toLowerCase() === searchValue ||
        pool.token0.name.toLowerCase().includes(searchValue) ||
        pool.token0.symbol.toLowerCase().includes(searchValue) ||
        pool.token1.name.toLowerCase().includes(searchValue) ||
        pool.token1.symbol.toLowerCase().includes(searchValue),
    )

    if (isShowOnlyActiveFarmPools) {
      const activePoolFarmAddress = Object.values(farms)
        .flat()
        .filter(item => item.endTime > +new Date() / 1000)
        .map(item => item.poolAddress.toLowerCase())
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

    const poolsGroupByPair = filteredPools.reduce((pairs, pool) => {
      const pairId = pool.token0.address + '_' + pool.token1.address
      return {
        ...pairs,
        [pairId]: [...(pairs[pairId] || []), pool].sort((a, b) => b.tvlUSD - a.tvlUSD),
      }
    }, initPairs)

    return Object.values(poolsGroupByPair).sort((a, b) => listComparator(a[0], b[0]))
  }, [poolDatas, searchValue, caId, cbId, listComparator, farms, isShowOnlyActiveFarmPools, chainId, onlyShowStable])

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
            <Trans>Pool | Fee</Trans>
          </ClickableText>
          <InfoHelper
            text={t`A token pair can have multiple pools, each with a different swap fee. Your swap fee earnings will be automatically reinvested in your pool`}
          />
        </Flex>
        <Flex alignItems="center" justifyContent="flex-start">
          <ClickableText
            style={{ textAlign: 'right' }}
            onClick={() => {
              setSortedColumn(SORT_FIELD.TVL)
              setSortDirection(sortedColumn !== SORT_FIELD.TVL ? true : !sortDirection)
            }}
          >
            <span>TVL</span>
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
        <Flex alignItems="center" justifyContent="flex-start">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.APR)
              setSortDirection(sortedColumn !== SORT_FIELD.APR ? true : !sortDirection)
            }}
          >
            <Trans>AVG APR</Trans>
            {sortedColumn === SORT_FIELD.APR ? (
              !sortDirection ? (
                <ChevronUp size="14" style={{ marginLeft: '2px' }} />
              ) : (
                <ChevronDown size="14" style={{ marginLeft: '2px' }} />
              )
            ) : (
              ''
            )}

            <InfoHelper text={t`Average estimated return based on yearly fees of the pool`} />
          </ClickableText>
        </Flex>
        <Flex alignItems="center" justifyContent="flex-end">
          <ClickableText
            onClick={() => {
              setSortedColumn(SORT_FIELD.VOL)
              setSortDirection(sortedColumn !== SORT_FIELD.VOL ? true : !sortDirection)
            }}
          >
            <Trans>VOLUME (24H)</Trans>
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
            <Trans>FEES (24H)</Trans>
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
          <ClickableText>
            <Trans>YOUR LIQUIDITY</Trans>
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

  const ITEM_PER_PAGE = 8
  const [page, setPage] = useState(1)
  useEffect(() => {
    setPage(1)
  }, [currencies, searchValue, onlyShowStable])

  const [sharedPoolId, setSharedPoolId] = useState('')
  const openShareModal = useOpenModal(ApplicationModal.SHARE)
  const isShareModalOpen = useModalOpen(ApplicationModal.SHARE)

  const shareUrl = sharedPoolId
    ? window.location.origin + '/pools?search=' + sharedPoolId + '&tab=elastic&networkId=' + chainId
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
  const pageData = pairDatas.slice((page - 1) * ITEM_PER_PAGE, page * ITEM_PER_PAGE)

  if (!anyLoading && !Object.keys(pairDatas).length)
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
      {anyLoading && !Object.keys(pairDatas).length && <LocalLoader />}
      {pageData.map((p, index) =>
        above1000 ? (
          <ProAmmPoolListItem
            key={index}
            pair={p}
            noBorderBottom={pairDatas.length <= pageData.length && index === pageData.length - 1}
            idx={index}
            onShared={setSharedPoolId}
            userPositions={userPositions}
          />
        ) : (
          <React.Fragment key={index}>
            <ProAmmPoolCardItem pair={p} idx={index} onShared={setSharedPoolId} userPositions={userPositions} />
            {index !== pageData.length - 1 && <DividerDash />}
          </React.Fragment>
        ),
      )}

      {!!pairDatas.length && (
        <Pagination
          onPageChange={setPage}
          totalCount={pairDatas.length}
          currentPage={page}
          pageSize={ITEM_PER_PAGE}
          haveBg={above1000}
        />
      )}
      <ShareModal url={shareUrl} />
    </PageWrapper>
  )
}
