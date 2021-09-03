import { ErrorBoundary } from '@sentry/react'
import { JSBI } from '@ubeswap/sdk'
import { partition } from 'lodash'
import React, { useMemo } from 'react'
import useStakingInfo from 'state/stake/useStakingInfo'
import styled from 'styled-components'

import { AutoColumn } from '../../components/Column'
import { PoolCard } from '../../components/earn/PoolCard'
import { CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import Loader from '../../components/Loader'
import { RowBetween } from '../../components/Row'
import { BIG_INT_ZERO } from '../../constants'
import { MultiRewardPool, multiRewardPools, StakingInfo } from '../../state/stake/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { DualPoolCard } from './DualPoolCard'
import { COUNTDOWN_END, LaunchCountdown } from './LaunchCountdown'
import { TriplePoolCard } from './TriplePoolCard'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const TopSection = styled(AutoColumn)`
  max-width: 720px;
  width: 100%;
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

export default function Earn() {
  // staking info for connected account
  const stakingInfos = useStakingInfo()

  // toggle copy if rewards are inactive
  const stakingRewardsExist = true

  const allPools = useMemo(
    () =>
      // Sort staking info by highest rewards
      stakingInfos?.slice().sort((a: StakingInfo, b: StakingInfo) => {
        return JSBI.toNumber(JSBI.subtract(b.totalRewardRates[0].raw, a.totalRewardRates[0].raw)) // TODO: Hardcode only checking the first totalRewardRate
      }),
    [stakingInfos]
  )

  const [stakedPools, unstakedPools] = useMemo(() => {
    return partition(allPools, (pool) => pool.stakedAmount && JSBI.greaterThan(pool.stakedAmount.raw, BIG_INT_ZERO))
  }, [allPools])

  const [activePools, inactivePools] = partition(unstakedPools, (pool) => pool.active)

  const isGenesisOver = COUNTDOWN_END < new Date().getTime()

  const multiRewards = multiRewardPools.map((multiPool) => {
    return [multiPool, allPools.find((pool) => pool.poolInfo.poolAddress === multiPool.basePool)]
  }) as [MultiRewardPool, StakingInfo][]

  const [dualRewards, inactiveDualRewards] = partition(
    multiRewards.filter(([pool]) => pool.numRewards === 2),
    ([pool]) => pool.active
  )
  const [tripleRewards, inactiveTripleRewards] = partition(
    multiRewards.filter(([pool]) => pool.numRewards === 3),
    ([pool]) => pool.active
  )

  return (
    <PageWrapper gap="lg" justify="center">
      {isGenesisOver && (
        <TopSection gap="md">
          <DataCard>
            <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>Ubeswap liquidity mining</TYPE.white>
                </RowBetween>
                <RowBetween>
                  <TYPE.white fontSize={14}>
                    Deposit your Liquidity Provider tokens to receive UBE, the Ubeswap protocol governance token.
                  </TYPE.white>
                </RowBetween>{' '}
                <ExternalLink
                  style={{ color: 'white', textDecoration: 'underline' }}
                  href="https://docs.ubeswap.org/faq"
                  target="_blank"
                >
                  <TYPE.white fontSize={14}>Read more about UBE</TYPE.white>
                </ExternalLink>
              </AutoColumn>
            </CardSection>
            <CardNoise />
          </DataCard>
        </TopSection>
      )}

      {!isGenesisOver && <LaunchCountdown />}

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Triple Reward Pools</TYPE.mediumHeader>
        </DataRow>
        {tripleRewards.map((x) => x[1]).some((x) => !x) && <Loader />}
        {tripleRewards.map((x) => {
          return (
            x[1] && (
              <PoolSection>
                <ErrorBoundary>
                  <TriplePoolCard
                    poolAddress={x[0].address}
                    dualPoolAddress={x[0].underlyingPool}
                    underlyingPool={x[1]}
                  />
                </ErrorBoundary>
              </PoolSection>
            )
          )
        })}
      </AutoColumn>

      {dualRewards.length > 0 && (
        <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
          <DataRow style={{ alignItems: 'baseline' }}>
            <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Dual Reward Pools</TYPE.mediumHeader>
          </DataRow>
          {dualRewards.map((x) => x[1]).some((x) => !x) && <Loader />}
          {dualRewards.map((x) => {
            return (
              x[1] && (
                <PoolSection>
                  <ErrorBoundary>
                    <DualPoolCard poolAddress={x[0].address} underlyingPool={x[1]} />
                  </ErrorBoundary>
                </PoolSection>
              )
            )
          })}
        </AutoColumn>
      )}

      {stakedPools.length > 0 && (
        <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
          <DataRow style={{ alignItems: 'baseline' }}>
            <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Your Pools</TYPE.mediumHeader>
            <div>{/* TODO(igm): show TVL here */}</div>
          </DataRow>

          <PoolSection>
            {stakedPools.map((pool) => (
              <ErrorBoundary key={pool.stakingRewardAddress}>
                <PoolCard stakingInfo={pool} />
              </ErrorBoundary>
            ))}
          </PoolSection>
        </AutoColumn>
      )}

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Available Pools</TYPE.mediumHeader>
          <div>
            {!isGenesisOver && (
              <span>
                Rewards begin on{' '}
                {new Date(COUNTDOWN_END).toLocaleString('en-us', {
                  timeZoneName: 'short',
                })}
              </span>
            )}
          </div>
          {/* TODO(igm): show TVL here */}
        </DataRow>
        <PoolSection>
          {stakingRewardsExist && stakingInfos?.length === 0 ? (
            <Loader style={{ margin: 'auto' }} />
          ) : (
            activePools?.map((pool) => (
              <ErrorBoundary key={pool.stakingRewardAddress}>
                <PoolCard stakingInfo={pool} />
              </ErrorBoundary>
            ))
          )}
        </PoolSection>
      </AutoColumn>

      {inactivePools.length > 0 && (
        <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
          <DataRow style={{ alignItems: 'baseline' }}>
            <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Inactive Pools</TYPE.mediumHeader>
            <div>{/* TODO(igm): show TVL here */}</div>
          </DataRow>

          <PoolSection>
            {inactivePools.map((pool) => (
              <ErrorBoundary key={pool.stakingRewardAddress}>
                <PoolCard stakingInfo={pool} />
              </ErrorBoundary>
            ))}
            {inactiveTripleRewards.map((x) => {
              return (
                x[1] && (
                  <PoolSection>
                    <ErrorBoundary>
                      <TriplePoolCard
                        poolAddress={x[0].address}
                        dualPoolAddress={x[0].underlyingPool}
                        underlyingPool={x[1]}
                      />
                    </ErrorBoundary>
                  </PoolSection>
                )
              )
            })}
            {inactiveDualRewards.map((x) => {
              return (
                x[1] && (
                  <PoolSection>
                    <ErrorBoundary>
                      <DualPoolCard poolAddress={x[0].address} underlyingPool={x[1]} />
                    </ErrorBoundary>
                  </PoolSection>
                )
              )
            })}
          </PoolSection>
        </AutoColumn>
      )}
    </PageWrapper>
  )
}
