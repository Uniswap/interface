import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMedia } from 'react-use'

import { ChainId } from 'libs/sdk/src'
import { ButtonPrimary } from 'components/Button'
import Panel from 'components/Panel'
import FarmsList from 'components/FarmsList'
import { useFarmsData } from 'state/farms/hooks'
import { useActiveWeb3React } from 'hooks'
import { BigNumber } from '@ethersproject/bignumber'
import { ExternalLink } from 'theme'
import { useBlockNumber, useFarmHistoryModalToggle, useKNCPrice } from 'state/application/hooks'
import { AVERAGE_BLOCK_TIME_IN_SECSS, FAIRLAUNCH_ADDRESSES } from '../../constants'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import Loader from 'components/Loader'
import HistoryImg from 'assets/svg/history.svg'
import {
  PageWrapper,
  KNCPriceContainer,
  KNCPriceWrapper,
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
  RewardNumberContainer,
  RewardToken,
  RewardUSD,
  RemainingTimeContainer,
  EndInTitle,
  HistoryButton
} from './styleds'
import { formattedNum, getTokenSymbol } from 'utils'
import Vesting from './vesting'
import { getFullDisplayBalance } from 'utils/formatBalance'
import RainMakerBannel from '../../assets/images/rain-maker.png'
import RainMakerMobileBanner from '../../assets/images/rain-maker-mobile.png'
import FarmHistoryModal from 'components/FarmHistoryModal'
import InfoHelper from 'components/InfoHelper'
import { Reward } from 'state/farms/types'
import { useFarmRewards, useFarmRewardsUSD, useRewardTokensFullInfo } from 'utils/dmm'
import { useFairLaunchContracts } from 'hooks/useContract'
import useFairLaunch from 'hooks/useFairLaunch'

const FARM_ENDED = 'Ended'

const Farms = () => {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const kncPrice = useKNCPrice()
  const lgBreakpoint = useMedia('(min-width: 992px)')
  const xxlBreakpoint = useMedia('(min-width: 1200px)')
  const { loading, data: farms } = useFarmsData()
  const [activeTab, setActiveTab] = useState(0)
  const [pendingTx, setPendingTx] = useState(false)
  const [stakedOnly, setStakedOnly] = useState(false)
  const fairLaunchContracts = useFairLaunchContracts()
  const { harvestMultiplePools } = useFairLaunch(FAIRLAUNCH_ADDRESSES[chainId as ChainId]?.[0])
  const toggleFarmHistoryModal = useFarmHistoryModalToggle()

  const totalRewards = useFarmRewards(farms)
  const totalRewardsUSD = useFarmRewardsUSD(totalRewards)

  const farm = farms && Array.isArray(farms) && farms.length > 0 && farms[0]
  const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber
  const remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
  const estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECSS[chainId as ChainId]
  const formattedEstimatedRemainingTime =
    estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)

  const stakedOnlyFarms = farms.filter(
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

  const rewardTokens = useRewardTokensFullInfo()

  return (
    <>
      <PageWrapper>
        <KNCPriceContainer>
          {kncPrice ? (
            <KNCPriceWrapper>
              <img
                src={`https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0xdeFA4e8a7bcBA345F687a2f1456F5Edd9CE97202/logo.png`}
                alt="knc-logo"
                width="20px"
              />
              {formattedNum(kncPrice, true)}
            </KNCPriceWrapper>
          ) : (
            <Loader />
          )}
        </KNCPriceContainer>
        <TabContainer>
          <TabWrapper>
            <Tab onClick={() => setActiveTab(0)} isActive={activeTab === 0}>
              <PoolTitleContainer>
                <span style={{ marginRight: '4px' }}>{t('allPools')}</span>
                {loading && <Loader />}
              </PoolTitleContainer>
            </Tab>
            <Tab onClick={() => setActiveTab(1)} isActive={activeTab === 1}>
              <div>{t('vesting')}</div>
            </Tab>
            {activeTab === 0 && (
              <StakedOnlyToggleWrapper>
                <StakedOnlyToggle
                  className="staked-only-switch"
                  checked={stakedOnly}
                  onClick={() => setStakedOnly(!stakedOnly)}
                />
                <StakedOnlyToggleText>Staked Only</StakedOnlyToggleText>
              </StakedOnlyToggleWrapper>
            )}
          </TabWrapper>
          <div>
            <HistoryButton onClick={toggleFarmHistoryModal}>
              <img src={HistoryImg} alt="HistoryImg" />
              History
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
                  Stake your DMM Liquidity Provider tokens to earn token rewards.
                </LearnMoreInstruction>
                <LearnMoreLinkContainer>
                  <ExternalLink href="https://docs.dmm.exchange">Learn More →</ExternalLink>
                </LearnMoreLinkContainer>
              </LearnMoreContainer>
              <HarvestAllContainer>
                <TotalRewardsContainer>
                  <TotalRewardsTitleWrapper>
                    <TotalRewardsTitle>My Total Rewards</TotalRewardsTitle>
                    <InfoHelper
                      text={
                        'Total rewards that can be harvested. Harvested rewards are locked and vested over ~30 days.'
                      }
                    />
                  </TotalRewardsTitleWrapper>
                  <RewardNumberContainer>
                    {totalRewards.map((reward, index) => {
                      return (
                        <RewardToken key={reward.token.address}>
                          <span>
                            {`${getFullDisplayBalance(reward?.amount)} ${getTokenSymbol(reward.token, chainId)}`}
                          </span>
                          {index + 1 < totalRewards.length ? <span style={{ margin: '0 4px' }}>+</span> : null}
                        </RewardToken>
                      )
                    })}
                  </RewardNumberContainer>
                  <RewardUSD>{totalRewardsUSD && formattedNum(totalRewardsUSD.toString(), true)}</RewardUSD>
                </TotalRewardsContainer>
                {shouldShowHarvestAllButton() && (
                  <div>
                    <ButtonPrimary
                      width="fit-content"
                      disabled={!canHarvest(totalRewards) || pendingTx}
                      padding="10px 36px"
                      onClick={handleClickHarvestAll}
                    >
                      Harvest All
                    </ButtonPrimary>
                  </div>
                )}
              </HarvestAllContainer>
            </HeadingContainer>

            <RemainingTimeContainer>
              <EndInTitle>END IN:</EndInTitle>
              <div>
                {!blockNumber ? (
                  <Loader />
                ) : isFarmEnded ? (
                  `${FARM_ENDED}`
                ) : (
                  <span>
                    <span style={{ marginRight: '4px' }}>{remainingBlocks} blocks</span>
                    <span>(~ {formattedEstimatedRemainingTime})</span>
                  </span>
                )}
              </div>
            </RemainingTimeContainer>

            <Panel>
              <FarmsList farms={stakedOnly ? stakedOnlyFarms : farms} />
            </Panel>
          </>
        ) : (
          <Vesting rewardTokens={rewardTokens} />
        )}
      </PageWrapper>
      <FarmHistoryModal farms={farms} />
    </>
  )
}

export default Farms
