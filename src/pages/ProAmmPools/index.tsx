import { Currency } from '@kyberswap/ks-sdk-core'
import useTheme from 'hooks/useTheme'
import React, { useMemo, useState, useEffect, useCallback } from 'react'
import { useMedia } from 'react-use'
import { Field } from 'state/mint/proamm/actions'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import InfoHelper from 'components/InfoHelper'
import { ChevronDown, ChevronUp } from 'react-feather'
import ProAmmPoolListItem from './ListItem'
import { usePoolDatas, useTopPoolAddresses, ProMMPoolData, useUserProMMPositions } from 'state/prommPools/hooks'
import LocalLoader from 'components/LocalLoader'
import Pagination from 'components/Pagination'
import ShareModal from 'components/ShareModal'
import { useActiveWeb3React } from 'hooks'
import { useOpenModal, useModalOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/actions'
import ProAmmPoolCardItem from './CardItem'
import { useProMMFarms } from 'state/farms/promm/hooks'
import { DividerDash } from 'components/Divider'
import { SelectPairInstructionWrapper } from 'pages/Pools/styleds'

type PoolListProps = {
  currencies: { [field in Field]?: Currency }
  searchValue: string
  isShowOnlyActiveFarmPools: boolean
}

const TableHeader = styled.div`
  display: grid;
  grid-gap: 1rem;
  grid-template-columns: 1.5fr 1.5fr 1.5fr 0.75fr 1fr 1fr 1.2fr 1.5fr;
  padding: 18px 16px;
  font-size: 12px;
  align-items: center;
  height: fit-content;
  position: relative;
  background-color: ${({ theme }) => theme.tableHeader};
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
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

export default function ProAmmPoolList({ currencies, searchValue, isShowOnlyActiveFarmPools }: PoolListProps) {
  const above1000 = useMedia('(min-width: 1000px)')
  const theme = useTheme()

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
          const a = poolA.volumeUSD / poolA.tvlUSD
          const b = poolB.volumeUSD / poolB.tvlUSD
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

    const poolsGroupByPair = filteredPools.reduce((pairs, pool) => {
      const pairId = pool.token0.address + '_' + pool.token1.address
      return {
        ...pairs,
        [pairId]: [...(pairs[pairId] || []), pool].sort((a, b) => b.tvlUSD - a.tvlUSD),
      }
    }, initPairs)

    return Object.values(poolsGroupByPair).sort((a, b) => listComparator(a[0], b[0]))
  }, [poolDatas, searchValue, caId, cbId, listComparator, farms, isShowOnlyActiveFarmPools])

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
            <Trans>AVG APY</Trans>
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

  const ITEM_PER_PAGE = 5
  const [page, setPage] = useState(1)
  useEffect(() => {
    setPage(1)
  }, [currencies, searchValue])

  const maxPage =
    pairDatas.length % ITEM_PER_PAGE === 0
      ? pairDatas.length / ITEM_PER_PAGE
      : Math.floor(pairDatas.length / ITEM_PER_PAGE) + 1

  const onPrev = () => {
    setPage(prev => (prev - 1 >= 1 ? prev - 1 : 1))
  }
  const onNext = () => {
    setPage(prev => (prev + 1 <= maxPage ? prev + 1 : maxPage))
  }

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
    <div style={{ background: above1000 ? theme.background : 'transparent', borderRadius: '8px', overflow: 'hidden' }}>
      {renderHeader()}
      {anyLoading && !Object.keys(pairDatas).length && <LocalLoader />}
      {pageData.map((p, index) =>
        above1000 ? (
          <ProAmmPoolListItem
            key={index}
            pair={p}
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

      {!!pairDatas.length && <Pagination onPrev={onPrev} onNext={onNext} currentPage={page} maxPage={maxPage} />}
      <ShareModal url={shareUrl} onShared={() => {}} />
    </div>
  )
}
