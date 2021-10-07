import React, { useState } from 'react'
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
  TotalRewardUSD,
  TableHeader,
  ClickableText,
  StakedOnlyToggleWrapper,
  StakedOnlyToggle,
  StakedOnlyToggleText
} from './styleds'
import ConfirmHarvestingModal from './ConfirmHarvestingModal'
import { Flex } from 'rebass'
import TotalRewardsDetail from './TotalRewardsDetail'
import LocalLoader from 'components/LocalLoader'
import useTheme from 'hooks/useTheme'

const YieldPools = ({ loading }: { loading: boolean }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const lgBreakpoint = useMedia('(min-width: 992px)')
  const above1000 = useMedia('(min-width: 1000px)')
  const { data: farmsByFairLaunch } = useFarmsData()
  const totalRewards = useFarmRewards(Object.values(farmsByFairLaunch).flat())
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)
  const [stakedOnly, setStakedOnly] = useState(false)

  const noFarms = FAIRLAUNCH_ADDRESSES[chainId as ChainId].every(fairlaunch => !farmsByFairLaunch[fairlaunch]?.length)

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

      <StakedOnlyToggleWrapper>
        <StakedOnlyToggle
          className="staked-only-switch"
          checked={stakedOnly}
          onClick={() => setStakedOnly(!stakedOnly)}
        />
        <StakedOnlyToggleText>
          <Trans>Staked Only</Trans>
        </StakedOnlyToggleText>
      </StakedOnlyToggleWrapper>

      {above1000 && (
        <TableHeader>
          <Flex grid-area="pools" alignItems="center" justifyContent="flex-start">
            <ClickableText>
              <Trans>Pools | AMP</Trans>
            </ClickableText>
            <InfoHelper
              text={t`AMP = Amplification factor. Amplified pools have higher capital efficiency. Higher AMP, higher capital efficiency and amplified liquidity within a price range.`}
            />
          </Flex>

          <Flex grid-area="liq" alignItems="center" justifyContent="flex-center">
            <ClickableText>
              <Trans>Staked TVL</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="end" alignItems="right" justifyContent="flex-end">
            <ClickableText>
              <Trans>Ending In</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="apy" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>APY</Trans>
            </ClickableText>
            <InfoHelper text={t`Estimated total annualized yield from fees + rewards`} />
          </Flex>

          <Flex grid-area="reward" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Rewards</Trans>
            </ClickableText>
          </Flex>

          <Flex grid-area="staked_balance" alignItems="center" justifyContent="flex-end">
            <ClickableText>
              <Trans>My Deposit</Trans>
            </ClickableText>
          </Flex>
        </TableHeader>
      )}

      {loading && noFarms ? (
        <Flex backgroundColor={theme.background}>
          <LocalLoader />
        </Flex>
      ) : (
        FAIRLAUNCH_ADDRESSES[chainId as ChainId].map(fairLaunchAddress => {
          return (
            <FairLaunchPools
              key={fairLaunchAddress}
              fairLaunchAddress={fairLaunchAddress}
              farms={farmsByFairLaunch[fairLaunchAddress]}
              stakedOnly={stakedOnly}
            />
          )
        })
      )}
    </>
  )
}

export default YieldPools
