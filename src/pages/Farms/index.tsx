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
  HarvestAllButtonContainer,
  HarvestAllInstruction,
  RewardNumberContainer,
  RewardToken,
  Plus,
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
  const isFarmStarted = farm && blockNumber && farm.startBlock < blockNumber
  const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber

  let remainingBlocks: number | false | undefined
  let estimatedRemainingSeconds: number | false | undefined
  let formattedEstimatedRemainingTime: string | false | 0 | undefined

  if (!isFarmStarted) {
    remainingBlocks = farm && blockNumber && farm.startBlock - blockNumber
    estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECSS[chainId as ChainId]
    formattedEstimatedRemainingTime = estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
  } else {
    remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
    estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECSS[chainId as ChainId]
    formattedEstimatedRemainingTime = estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)
  }

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

  const lockedTime = chainId && [97, 56, 43113, 43114].includes(chainId) ? '14' : '30'
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
                <span style={{ marginRight: '4px' }}>
                  <Trans>Eligible Pools</Trans>
                </span>
                {loading && <Loader />}
              </PoolTitleContainer>
            </Tab>
            <Tab onClick={() => setActiveTab(1)} isActive={activeTab === 1}>
              <div>
                <Trans>Vesting</Trans>
              </div>
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
                  <ExternalLink href="https://blog.kyber.network/kyberdmm-launches-on-binance-smart-chain-with-4m-in-liquidity-mining-rewards-6e0dddab3c6f">
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
                      text={t`Total rewards that can be harvested. Harvested rewards are locked and vested over ~${lockedTime} days.`}
                    />
                  </TotalRewardsTitleWrapper>
                  <RewardNumberContainer>
                    {totalRewards.map((reward, index) => {
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

            <RemainingTimeContainer>
              <EndInTitle>{!isFarmStarted ? t`START IN` : t`ENDING IN`}:</EndInTitle>
              <div>
                {!blockNumber ? (
                  <Loader />
                ) : isFarmEnded ? (
                  `${FARM_ENDED}`
                ) : (
                  <span>
                    <span style={{ marginRight: '4px' }}>
                      <Trans>{!remainingBlocks ? <Loader /> : remainingBlocks} blocks</Trans>
                    </span>
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
      <SwitchLocaleLink />
    </>
  )
}

export default Farms
