import { ErrorBoundary } from '@sentry/react'
import { JSBI } from '@ubeswap/sdk'
import ChangeNetworkModal from 'components/ChangeNetworkModal'
import { useIsSupportedNetwork } from 'hooks/useIsSupportedNetwork'
import useWindowDimensions from 'hooks/useWindowDimensions'
import { partition } from 'lodash'
import React, { memo, useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { areEqual, VariableSizeList as List } from 'react-window'
import { useOwnerStakedPools } from 'state/stake/useOwnerStakedPools'
import useStakingInfo from 'state/stake/useStakingInfo'
import styled from 'styled-components'

import { AutoColumn } from '../../components/Column'
import { PoolCard } from '../../components/earn/PoolCard'
import { CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import { RowBetween } from '../../components/Row'
import { StakingInfo } from '../../state/stake/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { DualPoolCard } from './DualPoolCard'
import { TriplePoolCard } from './TriplePoolCard'

const PageWrapper = styled.div`
  height: 400px;
  width: 100%;
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

const POOL_SECTION_HEADER_HEIGHT = 48
const STAKED_TRIPLE_POOL_CARD_HEIGHT = isMobile ? 130 : 200
const STAKED_DUAL_POOL_CARD_HEIGHT = isMobile ? 130 : 200
const STAKED_SINGLE_POOL_CARD_HEIGHT = isMobile ? 130 : 200
const INACTIVE_POOL_CARD_HEIGHT = isMobile ? 130 : 200
const TRIPLE_POOL_CARD_HEIGHT = isMobile ? 90 : 150
const DUAL_POOL_CARD_HEIGHT = isMobile ? 90 : 150
const SINGLE_POOL_CARD_HEIGHT = isMobile ? 90 : 150

const Header: React.FC = ({ children }) => {
  return (
    <DataRow style={{ alignItems: 'baseline' }}>
      <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>{children}</TYPE.mediumHeader>
    </DataRow>
  )
}

export default function Earn() {
  const { t } = useTranslation()
  const isSupportedNetwork = useIsSupportedNetwork()
  // staking info for connected account
  const stakingInfos = useStakingInfo()
  const { height } = useWindowDimensions()

  const allPools = useMemo(
    () =>
      // Sort staking info by highest rewards
      stakingInfos?.slice().sort((a: StakingInfo, b: StakingInfo) => {
        return JSBI.toNumber(JSBI.subtract(b.totalRewardRates[0].raw, a.totalRewardRates[0].raw)) // TODO: Hardcode only checking the first totalRewardRate
      }),
    [stakingInfos]
  )

  // stakedPools and unstakedPools excludes any multipools
  const { stakedMultiPools, unstakedMultiPools, stakedPools, unstakedPools } = useOwnerStakedPools(allPools)

  const [activeStakedPools, inactiveStakedPools] = partition(stakedPools, (pool) => pool.active)

  const [activePools] = partition(unstakedPools, (pool) => pool.active)

  const [stakedDualRewards, inactiveStakedDualRewards] = partition(
    stakedMultiPools.filter(([pool]) => pool.numRewards === 2),
    ([pool]) => pool.active
  )

  const [dualRewards] = partition(
    unstakedMultiPools.filter(([pool]) => pool.numRewards === 2),
    ([pool]) => pool.active
  )

  const [stakedTripleRewards, inactiveStakedTripleRewards] = useMemo(
    () =>
      partition(
        stakedMultiPools.filter(([pool]) => pool.numRewards === 3),
        ([pool]) => pool.active
      ),
    [stakedMultiPools]
  )

  const [tripleRewards] = useMemo(
    () =>
      partition(
        unstakedMultiPools.filter(([pool]) => pool.numRewards === 3),
        ([pool]) => pool.active
      ),
    [unstakedMultiPools]
  )

  const listRef = React.useRef<any>()
  const rows: { element: React.ReactNode; size: number }[] = [
    {
      element: (
        <TopSection gap="md">
          <DataCard>
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Ubeswap {t('liquidityMining')}</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white fontSize={14}>{t('liquidityMiningDesc')}</TYPE.white>
                </RowBetween>{' '}
                <ExternalLink
                  style={{ color: 'white', textDecoration: 'underline' }}
                  href="https://docs.ubeswap.org/faq"
                  target="_blank"
                >
                  <TYPE.white fontSize={14}>{t('liquidityMiningReadMore')}</TYPE.white>
                </ExternalLink>
              </AutoColumn>
            </CardSection>
            <CardNoise />
          </DataCard>
        </TopSection>
      ),
      size: 150,
    },
  ]
  if (stakedTripleRewards.length > 0) {
    rows.push({
      element: <Header>{t('yourTriplePools')}</Header>,
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    stakedTripleRewards.forEach((x) => {
      const [multiRewardPoolData, poolData] = x
      rows.push({
        element: (
          <ErrorBoundary>
            <TriplePoolCard
              poolAddress={multiRewardPoolData.address}
              dualPoolAddress={multiRewardPoolData.underlyingPool}
              underlyingPool={poolData}
              active={multiRewardPoolData.active}
            />
          </ErrorBoundary>
        ),
        size: STAKED_TRIPLE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (stakedDualRewards.length > 0) {
    rows.push({
      element: <Header>{t('yourDoublePools')}</Header>,
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    stakedDualRewards.forEach((x) => {
      const [multiRewardPoolData, poolData] = x
      rows.push({
        element: (
          <ErrorBoundary>
            <DualPoolCard
              poolAddress={multiRewardPoolData.address}
              underlyingPool={poolData}
              active={multiRewardPoolData.active}
            />
          </ErrorBoundary>
        ),
        size: STAKED_DUAL_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (activeStakedPools.length > 0) {
    rows.push({
      element: <Header>{t('yourPools')}</Header>,
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    activeStakedPools.forEach((x) => {
      rows.push({
        element: (
          <ErrorBoundary>
            <PoolCard stakingInfo={x} />
          </ErrorBoundary>
        ),
        size: STAKED_SINGLE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (inactiveStakedTripleRewards.length + inactiveStakedDualRewards.length + inactiveStakedPools.length > 0) {
    rows.push({
      element: (
        <Header>
          {t('Your')} {t('inactivePools')}
        </Header>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    inactiveStakedTripleRewards.forEach((x) => {
      rows.push({
        element: (
          <ErrorBoundary>
            <TriplePoolCard
              poolAddress={x[0].address}
              dualPoolAddress={x[0].underlyingPool}
              underlyingPool={x[1]}
              active={x[0].active}
            />
          </ErrorBoundary>
        ),
        size: INACTIVE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
    inactiveStakedDualRewards.forEach((x) => {
      rows.push({
        element: (
          <ErrorBoundary>
            <DualPoolCard poolAddress={x[0].address} underlyingPool={x[1]} active={x[0].active} />
          </ErrorBoundary>
        ),
        size: INACTIVE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
    inactiveStakedPools.forEach((pool) => {
      rows.push({
        element: (
          <ErrorBoundary key={pool.stakingRewardAddress}>
            <PoolCard stakingInfo={pool} />
          </ErrorBoundary>
        ),
        size: INACTIVE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (tripleRewards.length > 0) {
    rows.push({
      element: (
        <Header>
          {t('triple')} {t('rewardPools')}
        </Header>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    tripleRewards.forEach((x) => {
      rows.push({
        element: (
          <ErrorBoundary>
            <TriplePoolCard
              poolAddress={x[0].address}
              dualPoolAddress={x[0].underlyingPool}
              underlyingPool={x[1]}
              active={x[0].active}
            />
          </ErrorBoundary>
        ),
        size: TRIPLE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (dualRewards.length > 0) {
    rows.push({
      element: (
        <Header>
          {t('double')} {t('rewardPools')}
        </Header>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    dualRewards.forEach((x) => {
      rows.push({
        element: (
          <ErrorBoundary>
            <DualPoolCard poolAddress={x[0].address} underlyingPool={x[1]} active={x[0].active} />
          </ErrorBoundary>
        ),
        size: DUAL_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (activePools.length > 0) {
    rows.push({
      element: <Header>{t('availablePools')}</Header>,
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    activePools.forEach((pool) => {
      rows.push({
        element: (
          <ErrorBoundary>
            <PoolCard stakingInfo={pool} />
          </ErrorBoundary>
        ),
        size: SINGLE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getItemSize = React.useCallback((index: number) => rows[index].size, [rows.length])

  // eslint-disable-next-line react/prop-types
  const Row = memo<{ index: number; style: React.CSSProperties }>(({ index, style }) => {
    return (
      <div style={{ ...style, maxWidth: '640px', marginLeft: isMobile ? 0 : 'calc(50% - 320px)' }}>
        {rows[index].element}
      </div>
    )
  }, areEqual)
  Row.displayName = 'PoolCardRow'

  if (!isSupportedNetwork) {
    return <ChangeNetworkModal />
  }

  return (
    <PageWrapper>
      <AutoSizer>
        {({ width }) => (
          <List
            className="no-scrollbars"
            height={height - 200}
            overscanCount={20}
            itemCount={rows.length}
            itemSize={getItemSize}
            width={width}
            ref={listRef}
          >
            {Row}
          </List>
        )}
      </AutoSizer>
    </PageWrapper>
  )
}
