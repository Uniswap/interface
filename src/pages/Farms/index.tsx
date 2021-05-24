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
import { BigNumber } from '@ethersproject/bignumber'
import { ExternalLink } from 'theme'
import { useBlockNumber, useKNCPrice } from 'state/application/hooks'
import { AVERAGE_BLOCK_TIME_IN_SECS } from '../../constants'
import { getFormattedTimeFromSecond } from 'utils/formatTime'
import Loader from 'components/Loader'
import {
  PageWrapper,
  TabContainer,
  Tab,
  HeadingContainer,
  LearnMoreContainer,
  LearnMoreInstruction,
  LearnMoreLinkContainer,
  HarvestAllContainer,
  TotalRewardsContainer,
  TotalRewardsTitle,
  RewardNumber,
  RewardUSD,
  RemainingTimeContainer,
  EndInTitle,
  ConnectWalletFarm
} from './styleds'
import { formattedNum } from 'utils'
import Vesting from './vesting'
import { getFullDisplayBalance } from 'utils/formatBalance'

const FARM_ENDED = 'Ended'

const Farms = () => {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const blockNumber = useBlockNumber()
  const kncPrice = useKNCPrice()
  const { loading: publicDataLoading, error: publicDataError, data: allFarms } = useFarmsPublicData()
  const { loading: userFarmsLoading, data: farmsUserData } = useFarmsUserData(account, allFarms)
  const [activeTab, setActiveTab] = useState(0)

  if (!account) {
    return (
      <PageWrapper>
        <Panel>
          <ConnectWalletFarm>{t('connectWalletFarm')}</ConnectWalletFarm>
        </Panel>
      </PageWrapper>
    )
  }

  if (publicDataLoading || userFarmsLoading) {
    return <LocalLoader />
  }

  if (publicDataError) {
    return <div>Error</div>
  }

  const farms = farmsUserData.map(farmUserData => {
    const { pid } = farmUserData
    const index = allFarms.findIndex(farm => farm.pid === pid)

    return { ...allFarms[index], userData: farmUserData }
  })

  const totalRewards = farms.reduce((total, farm) => {
    if (farm.userData.earnings) {
      return total.add(BigNumber.from(farm.userData.earnings))
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

  return (
    <>
      <PageWrapper>
        <TabContainer>
          <Tab onClick={() => setActiveTab(0)} isActive={activeTab === 0}>
            <div>{t('allPools')}</div>
          </Tab>
          <Tab onClick={() => setActiveTab(1)} isActive={activeTab === 1}>
            <div>{t('vesting')}</div>
          </Tab>
        </TabContainer>

        {activeTab === 0 ? (
          <>
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
                  <TotalRewardsTitle>My Total Rewards</TotalRewardsTitle>
                  <RewardNumber>{getFullDisplayBalance(totalRewards)} KNC</RewardNumber>
                  <RewardUSD>{totalRewardsUSD && formattedNum(totalRewardsUSD, true)}</RewardUSD>
                </TotalRewardsContainer>
                <div>
                  <ButtonPrimary disabled={totalRewards.lte(BigNumber.from(0))} padding="10px 36px">
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
              <FarmsList farms={farms} />
            </Panel>
          </>
        ) : (
          <Vesting />
        )}
      </PageWrapper>
      <FarmClaimModal />
      <FarmStakeModal />
    </>
  )
}

export default Farms
