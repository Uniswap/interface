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
import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
// import { JSBI } from '@teleswap/sdk'
// import { BIG_INT_ZERO } from '../../constants'
// import { OutlineCard } from '../../components/Card'

const PageWrapper = styled(AutoColumn)`
  max-width: 1132px;
  width: 100%;
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
  background: #000;
  padding: 48px;
  color: #39E1BA;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

export default function FarmList() {
  const { chainId } = useActiveWeb3React()
  console.debug('chainId', chainId)
  const farmingConfig = CHAINID_TO_FARMING_CONFIG[chainId || 420]
  // const mchefContract = useChefContract(farmingConfig?.chefType || Chef.MINICHEF)
  // const positions = useChefPositions(mchefContract, undefined, chainId)
  const poolInfos = useMasterChefPoolInfo(farmingConfig?.chefType || Chef.MINICHEF)

  useEffect(() => {
    console.info('useMasterChefPoolInfo', poolInfos)
  }, [poolInfos])
  // // staking info for connected account
  // const stakingInfos = useStakingInfo()

  return (
    <PageWrapper gap="lg" justify="center">
      {/* <TopSection gap="md">
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
      </TopSection> */}

      <AutoColumn gap="lg" style={{ width: '100%' }}>
        <DataRow style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
          <TYPE.largeHeader color="#FFF" style={{ marginTop: '0.5rem' }}>
            Farming Pools
          </TYPE.largeHeader>
          <TYPE.mediumHeader color="#FFF" style={{ marginTop: '12px', width: '100%' }}>
            Stake LP tokens to earn rewards
          </TYPE.mediumHeader>
          {/* <Countdown exactEnd={stakingInfos?.[0]?.periodFinish} /> */}
        </DataRow>

        <PoolSection>
          {poolInfos.length === 0
            ? 'Loading...'
            : poolInfos.map((_poolInfo, pid) => {
                return <PoolCard key={pid} pid={pid} />
              })}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}
