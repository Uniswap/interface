import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { ButtonPrimary } from 'components/Button'
import LocalLoader from 'components/LocalLoader'
import Panel from 'components/Panel'
import FarmsList from 'components/FarmsList'
import FarmClaimModal from 'components/FarmClaimModal'
import FarmStakeModal from 'components/FarmStakeModal'
import { useFarmsPublicData, useFarmsUserData } from 'state/farms/hooks'
import { useActiveWeb3React } from 'hooks'
import useMasterChef from 'hooks/useMasterchef'
import { BigNumber } from '@ethersproject/bignumber'
import { ExternalLink } from 'theme'
import { useBlockNumber, useFarmHistoryModalToggle, useKNCPrice } from 'state/application/hooks'
import { AVERAGE_BLOCK_TIME_IN_SECS } from '../../constants'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import Loader from 'components/Loader'
import HistoryImg from 'assets/svg/history.svg'

import {
  PageWrapper,
  KNCPriceContainer,
  KNCPriceWrapper,
  TabContainer,
  Tab,
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
  RewardNumber,
  RewardUSD,
  RemainingTimeContainer,
  EndInTitle,
  HistoryButton
} from './styleds'
import { formattedNum } from 'utils'
import Vesting from './vesting'
import { getFullDisplayBalance } from 'utils/formatBalance'
import RainMaker from '../../assets/images/rain-maker.webp'
import FarmHistoryModal from 'components/FarmHistoryModal'
import InfoHelper from 'components/InfoHelper'

const FARM_ENDED = 'Ended'

const Farms = () => {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const kncPrice = useKNCPrice()
  const { loading: publicDataLoading, error: publicDataError, data: allFarms } = useFarmsPublicData()
  const { loading: userFarmsLoading, data: farmsUserData } = useFarmsUserData(account, allFarms)
  const [activeTab, setActiveTab] = useState(0)
  const [pendingTx, setPendingTx] = useState(false)
  const [stakedOnly, setStakedOnly] = useState(false)
  const toggleFarmHistoryModal = useFarmHistoryModalToggle()

  const { harvestMultiplePools } = useMasterChef()

  if (publicDataLoading || userFarmsLoading) {
    return <LocalLoader />
  }

  const farms = allFarms.map(farm => {
    const { pid } = farm
    const index = farmsUserData.findIndex(farmUserData => farmUserData.pid === pid)

    return {
      ...farm,
      userData: farmsUserData[index]
    }
  })

  const totalRewards = farms.reduce((total, farm) => {
    if (farm.userData?.earnings) {
      return total.add(BigNumber.from(farm.userData?.earnings))
    }

    return total
  }, BigNumber.from(0))

  const totalRewardsUSD =
    totalRewards &&
    kncPrice &&
    (parseFloat(getFullDisplayBalance(totalRewards).toString()) * parseFloat(kncPrice)).toString()

  const farm = farms && Array.isArray(farms) && farms.length > 0 && farms[0]
  const isFarmEnded = farm && blockNumber && farm.endBlock < blockNumber
  const remainingBlocks = farm && blockNumber && farm.endBlock - blockNumber
  const estimatedRemainingSeconds = remainingBlocks && remainingBlocks * AVERAGE_BLOCK_TIME_IN_SECS
  const formattedEstimatedRemainingTime =
    estimatedRemainingSeconds && getFormattedTimeFromSecond(estimatedRemainingSeconds)

  const stakedOnlyFarms = farms.filter(
    farm => farm.userData?.stakedBalance && BigNumber.from(farm.userData.stakedBalance).gt(0)
  )

  const handleClickHarvestAll = async () => {
    setPendingTx(true)

    const poolsHaveReward = farms.filter(farm => farm.userData.earnings && BigNumber.from(farm.userData.earnings).gt(0))
    await harvestMultiplePools(poolsHaveReward.map(farm => farm.pid))

    setPendingTx(false)
  }

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
          <Tab onClick={() => setActiveTab(0)} isActive={activeTab === 0}>
            <div>{t('allPools')}</div>
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
          <HistoryButton onClick={toggleFarmHistoryModal}>
            <img src={HistoryImg} alt="HistoryImg" />
            History
          </HistoryButton>
        </TabContainer>

        {activeTab === 0 ? (
          <>
            <AdContainer>
              <img src={RainMaker} alt="RainMaker" width="100%" />
            </AdContainer>
            <HeadingContainer>
              <LearnMoreContainer>
                <LearnMoreInstruction>
                  Stake your DMM Liquidity Provider tokens to earn KNC token rewards.
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
                  <RewardNumber>{getFullDisplayBalance(totalRewards)} KNC</RewardNumber>
                  <RewardUSD>{totalRewardsUSD && formattedNum(totalRewardsUSD, true)}</RewardUSD>
                </TotalRewardsContainer>
                <div>
                  <ButtonPrimary
                    disabled={totalRewards.lte(BigNumber.from(0)) || pendingTx}
                    padding="10px 36px"
                    onClick={handleClickHarvestAll}
                  >
                    Harvest All
                  </ButtonPrimary>
                </div>
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
          <Vesting />
        )}
      </PageWrapper>
      <FarmClaimModal />
      <FarmStakeModal />
      <FarmHistoryModal farms={farms} />
    </>
  )
}

export default Farms
