import { ErrorBoundary } from '@sentry/react'
import { JSBI } from '@ubeswap/sdk'
import ChangeNetworkModal from 'components/ChangeNetworkModal'
import { useIsSupportedNetwork } from 'hooks/useIsSupportedNetwork'
import useWindowDimensions from 'hooks/useWindowDimensions'
import { partition } from 'lodash'
import React, { useMemo } from 'react'
import { isMobile } from 'react-device-detect'
import { useTranslation } from 'react-i18next'
import { VariableSizeList as List } from 'react-window'
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

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
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
const STAKED_TRIPLE_POOL_CARD_HEIGHT = isMobile ? 210 : 380
const STAKED_DUAL_POOL_CARD_HEIGHT = isMobile ? 200 : 350
const STAKED_SINGLE_POOL_CARD_HEIGHT = isMobile ? 180 : 320
const INACTIVE_POOL_CARD_HEIGHT = isMobile ? 180 : 210
const TRIPLE_POOL_CARD_HEIGHT = isMobile ? 90 : 300
const DUAL_POOL_CARD_HEIGHT = isMobile ? 90 : 270
const SINGLE_POOL_CARD_HEIGHT = isMobile ? 90 : 236

export default function Earn() {
  const { t } = useTranslation()
  const isSupportedNetwork = useIsSupportedNetwork()
  // staking info for connected account
  const stakingInfos = useStakingInfo()
  const { height, width } = useWindowDimensions()

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
  const rows: { element: React.ReactNode; size: number }[] = []
  if (stakedTripleRewards.length > 0) {
    rows.push({
      element: (
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>{t('yourTriplePools')}</TYPE.mediumHeader>
        </DataRow>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    stakedTripleRewards.forEach((x) => {
      const [multiRewardPoolData, poolData] = x
      if (!poolData) {
        return
      }
      rows.push({
        element: (
          <TriplePoolCard
            poolAddress={multiRewardPoolData.address}
            dualPoolAddress={multiRewardPoolData.underlyingPool}
            underlyingPool={poolData}
            active={multiRewardPoolData.active}
          />
        ),
        size: STAKED_TRIPLE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (stakedDualRewards.length > 0) {
    rows.push({
      element: (
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>{t('yourDoublePools')}</TYPE.mediumHeader>
        </DataRow>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    stakedDualRewards.forEach((x) => {
      const [multiRewardPoolData, poolData] = x
      if (!poolData) return
      rows.push({
        element: (
          <DualPoolCard
            poolAddress={multiRewardPoolData.address}
            underlyingPool={poolData}
            active={multiRewardPoolData.active}
          />
        ),
        size: STAKED_DUAL_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (activeStakedPools.length > 0) {
    rows.push({
      element: (
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>{t('yourPools')}</TYPE.mediumHeader>
          <div>{/* TODO(igm): show TVL here */}</div>
        </DataRow>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    activeStakedPools.forEach((x) => {
      rows.push({
        element: <PoolCard stakingInfo={x} />,
        size: STAKED_SINGLE_POOL_CARD_HEIGHT,
      })
      listRef?.current?.resetAfterIndex(rows.length - 1)
    })
  }
  if (inactiveStakedTripleRewards.length + inactiveStakedDualRewards.length + inactiveStakedPools.length > 0) {
    rows.push({
      element: (
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>
            {t('Your')} {t('inactivePools')}
          </TYPE.mediumHeader>
          <div>{/* TODO(igm): show TVL here */}</div>
        </DataRow>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    inactiveStakedTripleRewards.forEach((x) => {
      if (!x[1]) return
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
      if (!x[1]) return
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
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>
            {t('triple')} {t('rewardPools')}
          </TYPE.mediumHeader>
        </DataRow>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    tripleRewards.forEach((x) => {
      if (!x[1]) return
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
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>
            {t('double')} {t('rewardPools')}
          </TYPE.mediumHeader>
        </DataRow>
      ),
      size: POOL_SECTION_HEADER_HEIGHT,
    })
    listRef?.current?.resetAfterIndex(rows.length - 1)
    dualRewards.forEach((x) => {
      if (!x[1]) return
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
      element: (
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>{t('availablePools')}</TYPE.mediumHeader>
        </DataRow>
      ),
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

  const Row: React.FC<{ index: number; style: React.CSSProperties }> = ({ index, style }) => {
    return <div style={style}>{rows[index].element}</div>
  }

  if (!isSupportedNetwork) {
    return <ChangeNetworkModal />
  }

  return (
    <PageWrapper gap="lg" justify="center">
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

      <List
        className="no-scrollbars"
        height={height / 1.6}
        itemCount={rows.length}
        itemSize={getItemSize}
        width={Math.min(width - 40, 640)}
        ref={listRef}
      >
        {Row}
      </List>
    </PageWrapper>
  )
}
