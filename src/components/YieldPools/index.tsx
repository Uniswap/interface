import React from 'react'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'

import { ChainId } from 'libs/sdk/src'
import RainMakerBannel from 'assets/images/rain-maker.png'
import RainMakerMobileBanner from 'assets/images/rain-maker-mobile.png'
import { FAIRLAUNCH_ADDRESSES } from 'constants/index'
import FairLaunchPools from 'components/YieldPools/FairLaunchPools'
import InfoHelper from 'components/InfoHelper'
import { useActiveWeb3React } from 'hooks'
import { useFarmsData } from 'state/farms/hooks'
import { ExternalLink } from 'theme'
import { formattedNum } from 'utils'
import { useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import {
  AdContainer,
  HeadingContainer,
  LearnMoreContainer,
  LearnMoreInstruction,
  LearnMoreLinkContainer,
  HarvestAllContainer,
  TotalRewardsContainer,
  TotalRewardsTitleWrapper,
  TotalRewardsTitle,
  TotalRewardUSD
} from './styleds'
import ConfirmHarvestingModal from './ConfirmHarvestingModal'
import { Flex } from 'rebass'
import TotalRewardsDetail from './TotalRewardsDetail'

const YieldPools = ({ stakedOnly }: { stakedOnly: boolean }) => {
  const { chainId } = useActiveWeb3React()
  const lgBreakpoint = useMedia('(min-width: 992px)')
  const { data: farmsByFairLaunch } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farmsByFairLaunch).flat())
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  return (
    <>
      <ConfirmHarvestingModal />
      <AdContainer>
        <img src={lgBreakpoint ? RainMakerBannel : RainMakerMobileBanner} alt="RainMaker" width="100%" />
      </AdContainer>
      <HeadingContainer>
        <LearnMoreContainer>
          <LearnMoreInstruction>
            <Trans>Stake your DMM Liquidity Provider tokens to earn token rewards.</Trans>
          </LearnMoreInstruction>
          <LearnMoreLinkContainer>
            <ExternalLink href="https://docs.dmm.exchange/rainmaker/FAQs">
              <Trans>Learn More →</Trans>
            </ExternalLink>
          </LearnMoreLinkContainer>
        </LearnMoreContainer>
        <HarvestAllContainer>
          <TotalRewardsContainer>
            <TotalRewardsTitleWrapper>
              <TotalRewardsTitle>
                <Trans>My Total Rewards</Trans>
              </TotalRewardsTitle>
              <InfoHelper
                text={t`Total rewards that can be harvested. Harvested rewards are locked and vested over a short period (duration depends on the pool).`}
              />
            </TotalRewardsTitleWrapper>

            <Flex>
              <TotalRewardUSD>{totalRewardsUSD ? formattedNum(totalRewardsUSD.toString(), true) : '$0'}</TotalRewardUSD>
              {totalRewardsUSD > 0 && totalRewards.length > 0 && <TotalRewardsDetail totalRewards={totalRewards} />}
            </Flex>
          </TotalRewardsContainer>
        </HarvestAllContainer>
      </HeadingContainer>

      {FAIRLAUNCH_ADDRESSES[chainId as ChainId].map(fairLaunchAddress => {
        return (
          <FairLaunchPools
            key={fairLaunchAddress}
            fairLaunchAddress={fairLaunchAddress}
            farms={farmsByFairLaunch[fairLaunchAddress]}
            stakedOnly={stakedOnly}
          />
        )
      })}
    </>
  )
}

export default YieldPools
