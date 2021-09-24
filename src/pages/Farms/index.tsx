import React, { useState } from 'react'
import { useMedia } from 'react-use'
import { t, Trans } from '@lingui/macro'

import { ChainId } from 'libs/sdk/src'
import { ButtonPrimary } from 'components/Button'
import Panel from 'components/Panel'
import FarmsList from 'components/FarmsList'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { useFarmsData } from 'state/farms/hooks'
import { useActiveWeb3React } from 'hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { ExternalLink } from 'theme'
import { useBlockNumber, useFarmHistoryModalToggle } from 'state/application/hooks'
import { AVERAGE_BLOCK_TIME_IN_SECS, FAIRLAUNCH_ADDRESSES } from '../../constants'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import Loader from 'components/Loader'
import HistoryImg from 'assets/svg/history.svg'
import {
  PageWrapper,
  TabContainer,
  TabWrapper,
  Tab,
  PoolTitleContainer,
  StakedOnlyToggleWrapper,
  StakedOnlyToggle,
  StakedOnlyToggleText,
  AdContainer,
  HeadingContainer,
  LearnMoreContainer,
  LearnMoreInstruction,
  LearnMoreLinkContainer,
  HarvestAllContainer,
  TotalRewardsContainer,
  TotalRewardsTitleWrapper,
  TotalRewardsTitle,
  HarvestAllButtonContainer,
  HarvestAllInstruction,
  RewardNumberContainer,
  RewardToken,
  Plus,
  RewardUSD,
  HistoryButton
} from './styleds'
import { formattedNum, getTokenSymbol } from 'utils'
import Vesting from 'components/Vesting'
import { getFullDisplayBalance } from 'utils/formatBalance'
import RainMakerBannel from '../../assets/images/rain-maker.png'
import RainMakerMobileBanner from '../../assets/images/rain-maker-mobile.png'
import FarmHistoryModal from 'components/FarmHistoryModal'
import InfoHelper from 'components/InfoHelper'
import { Reward } from 'state/farms/types'
import { useFarmRewards, useFarmRewardsUSD } from 'utils/dmm'
import { useFairLaunchContracts } from 'hooks/useContract'
import useFairLaunch from 'hooks/useFairLaunch'
import { useSelector } from 'react-redux'
import { AppState } from 'state'

const Farms = () => {
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const lgBreakpoint = useMedia('(min-width: 992px)')
  const { loading, data: farms } = useFarmsData()
  const [activeTab, setActiveTab] = useState(0)
  const [pendingTx, setPendingTx] = useState(false)
  const [stakedOnly, setStakedOnly] = useState(false)
  const fairLaunchContracts = useFairLaunchContracts()
  const { harvestMultiplePools } = useFairLaunch(FAIRLAUNCH_ADDRESSES[chainId as ChainId]?.[0])
  const toggleFarmHistoryModal = useFarmHistoryModalToggle()
  const vestingLoading = useSelector<AppState, boolean>(state => state.vesting.loading)

  const totalRewards = useFarmRewards(farms)
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  const farmsList = farms.map(farm => {
    const isFarmStarted = farm && blockNumber && farm.startBlock < blockNumber
    const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber

    let remainingBlocks: number | false | undefined
    let estimatedRemainingSeconds: number | false | undefined
    let formattedEstimatedRemainingTime: string | false | 0 | undefined

    if (!isFarmStarted) {
      remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
      estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
      formattedEstimatedRemainingTime =
        estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
    } else {
      remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
      estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS[chainId as ChainId]
      formattedEstimatedRemainingTime =
        estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
    }
    return {
      ...farm,
      time: `${isFarmEnded ? 'Ended' : (isFarmStarted ? '' : 'Start in ') + formattedEstimatedRemainingTime}`
    }
  })

  const stakedOnlyFarms = farmsList.filter(
    farm => farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
  )

  const shouldShowHarvestAllButton = (): boolean => {
    if (!fairLaunchContracts || Object.keys(fairLaunchContracts).length !== 1) {
      return false
    }

    return true
  }

  const handleClickHarvestAll = async () => {
    if (!shouldShowHarvestAllButton()) {
      return
    }

    setPendingTx(true)

    const poolsHaveReward = farms.filter(farm => {
      if (!farm.userData?.rewards) {
        return false
      }

      const hasReward = farm.userData?.rewards?.some(value => BigNumber.from(value).gt(0))

      return hasReward
    })

    await harvestMultiplePools(poolsHaveReward.map(farm => farm.pid))

    setPendingTx(false)
  }

  const canHarvest = (rewards: Reward[]): boolean => {
    const canHarvest = rewards.some(reward => reward?.amount.gt(BigNumber.from('0')))

    return canHarvest
  }

  return (
    <>
      <PageWrapper>
        <TabContainer>
          <TabWrapper>
            <Tab onClick={() => setActiveTab(0)} isActive={activeTab === 0}>
              <PoolTitleContainer>
                <span style={{ marginRight: '4px' }}>
                  <Trans>Eligible Pools</Trans>
                </span>
                {loading && <Loader />}
              </PoolTitleContainer>
            </Tab>
            <Tab onClick={() => setActiveTab(1)} isActive={activeTab === 1}>
              <PoolTitleContainer>
                <span style={{ marginRight: '4px' }}>
                  <Trans>Vesting</Trans>
                </span>
                {vestingLoading && <Loader />}
              </PoolTitleContainer>
            </Tab>
            {activeTab === 0 && (
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
            )}
          </TabWrapper>
          <div>
            <HistoryButton onClick={toggleFarmHistoryModal}>
              <img src={HistoryImg} alt="HistoryImg" />
              <Trans>History</Trans>
            </HistoryButton>
          </div>
        </TabContainer>

        {activeTab === 0 ? (
          <>
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
                  <RewardNumberContainer>
                    {totalRewards.map((reward, index) => {
                      if (!reward || !reward.amount || reward.amount.lte(0)) {
                        return null
                      }

                      return (
                        <RewardToken key={reward.token.address}>
                          <span>
                            {`${getFullDisplayBalance(reward?.amount)} ${getTokenSymbol(reward.token, chainId)}`}
                          </span>
                          {index + 1 < totalRewards.length ? <Plus>+</Plus> : null}
                        </RewardToken>
                      )
                    })}
                  </RewardNumberContainer>
                  <RewardUSD>{totalRewardsUSD ? formattedNum(totalRewardsUSD.toString(), true) : '$0'}</RewardUSD>
                </TotalRewardsContainer>
                {shouldShowHarvestAllButton() ? (
                  <HarvestAllButtonContainer>
                    <ButtonPrimary
                      width="fit-content"
                      disabled={!canHarvest(totalRewards) || pendingTx}
                      padding="10px 36px"
                      onClick={handleClickHarvestAll}
                    >
                      <Trans>Harvest All</Trans>
                    </ButtonPrimary>
                  </HarvestAllButtonContainer>
                ) : (
                  <HarvestAllInstruction>
                    <Trans>Harvest your rewards by clicking your eligible pool/s in the list below.</Trans>
                  </HarvestAllInstruction>
                )}
              </HarvestAllContainer>
            </HeadingContainer>
            <Panel>
              <FarmsList farms={stakedOnly ? stakedOnlyFarms : farmsList} />
            </Panel>
          </>
        ) : (
          <Vesting />
        )}
      </PageWrapper>
      <FarmHistoryModal farms={farmsList} />
      <SwitchLocaleLink />
    </>
  )
}

export default Farms
