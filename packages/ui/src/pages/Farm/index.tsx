import React, { useEffect } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { TYPE, ExternalLink } from '../../theme'
import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise, CardBGImage } from '../../components/earn/styled'
// import { Countdown } from './Countdown'
import { useActiveWeb3React } from '../../hooks'
import PoolCard from './PoolCard'
import { useChefPositions } from 'hooks/farm/useChefPositions'
import { useMasterChefPoolInfo } from 'hooks/farm/useMasterChefPoolInfo'
import { Chef } from 'constants/farm/chef.enum'
import { useChefContract } from 'hooks/farm/useChefContract'
// import { JSBI } from '@teleswap/sdk'
// import { BIG_INT_ZERO } from '../../constants'
// import { OutlineCard } from '../../components/Card'

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

export default function FarmList() {
  const { chainId } = useActiveWeb3React()
  console.debug('chainId', chainId)

  const mchefContract = useChefContract(Chef.MINICHEF)
  const positions = useChefPositions(mchefContract, undefined, chainId)
  const poolInfos = useMasterChefPoolInfo(Chef.MINICHEF)

  useEffect(() => {
    console.info('useChefPositions', positions);
  }, [positions])
  useEffect(() => {
    console.info('useMasterChefPoolInfo', poolInfos);
  }, [poolInfos])
  // // staking info for connected account
  // const stakingInfos = useStakingInfo()

  return (
    <PageWrapper gap="lg" justify="center">
      <TopSection gap="md">
        <DataCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Uniswap liquidity mining</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Deposit your Liquidity Provider tokens to receive UNI, the Uniswap protocol governance token.
                </TYPE.white>
              </RowBetween>{' '}
              <ExternalLink
                style={{ color: 'white', textDecoration: 'underline' }}
                href="https://uniswap.org/blog/uni/"
                target="_blank"
              >
                <TYPE.white fontSize={14}>Read more about UNI</TYPE.white>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </DataCard>
      </TopSection>

      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Participating pools</TYPE.mediumHeader>
          {/* <Countdown exactEnd={stakingInfos?.[0]?.periodFinish} /> */}
        </DataRow>

        <PoolSection>
          {
            poolInfos.length === 0 ? 'Loading...' : poolInfos.map((_poolInfo, pid) => {
              return <PoolCard key={pid} pid={pid} />
            })
          }
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}
