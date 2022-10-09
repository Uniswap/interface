// import { Chef } from 'constants/farm/chef.enum'
// import { CHAINID_TO_FARMING_CONFIG } from 'constants/farming.config'
// import { useChefPositions } from 'hooks/farm/useChefPositions'
// import { useChefContract } from 'hooks/farm/useChefContract'
import { useChefStakingInfo } from 'hooks/farm/useChefStakingInfo'
// import { useMasterChefPoolInfo } from 'hooks/farm/useMasterChefPoolInfo'
import { useEffect } from 'react'
import styled from 'styled-components'

import { AutoColumn } from '../../components/Column'
import { RowBetween } from '../../components/Row'
// import { Countdown } from './Countdown'
import { useActiveWeb3React } from '../../hooks'
import { TYPE } from '../../theme'
import PoolCard from './PoolCard'

// import { JSBI } from '@teleswap/sdk'
// import { BIG_INT_ZERO } from '../../constants'
// import { OutlineCard } from '../../components/Card'

const PageWrapper = styled(AutoColumn)`
  max-width: 67.5rem;
  width: 100%;
  ${({ theme }) => theme.mediaWidth.upToSmall`
  width: 100%;
`};
`

const PoolSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  height: 60vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 24px;
  grid-template-columns: 1fr;
  // row-gap: 24px;
  width: 100%;
  justify-self: center;
  background: rgba(25, 36, 47, 1);
  padding: 3.5vw
  color: #39e1ba;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

export default function FarmList() {
  const { chainId } = useActiveWeb3React()
  console.debug('chainId', chainId)
  // const mchefContract = useChefContract(farmingConfig?.chefType || Chef.MINICHEF)
  // const positions = useChefPositions(mchefContract, undefined, chainId)
  const stakingInfos = useChefStakingInfo()
  useEffect(() => {
    console.info('useChefStakingInfo', stakingInfos)
  }, [stakingInfos])
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
          {stakingInfos.length === 0
            ? 'Loading...'
            : stakingInfos.map((_poolInfo, pid) => {
                if (!_poolInfo) return null
                if (_poolInfo.isHidden) return null
                return <PoolCard key={pid} pid={pid} stakingInfo={_poolInfo} />
              })}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}
