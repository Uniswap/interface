import React, { useState } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'react-i18next'

import { ButtonEmpty } from 'components/Button'
import LocalLoader from 'components/LocalLoader'
import Panel from 'components/Panel'
import FarmsList from 'components/FarmsList'
import FarmClaimModal from 'components/FarmClaimModal'
import FarmStakeModal from 'components/FarmStakeModal'
import { useFarmsPublicData, useFarmsUserData } from 'state/farms/hooks'
import { useActiveWeb3React } from 'hooks'

const PageWrapper = styled.div`
  padding: 0 17em;
  width: 100%;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    padding: 0 12rem;
  `};

  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 0 4em;
  `};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0;
  `};
`

const TabContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  margin-bottom: 1.5rem;
`

const Tab = styled(ButtonEmpty)<{ isActive: boolean }>`
  width: fit-content;
  margin-right: 2rem;
  padding: 0 0 0 8px;
  color: ${({ theme }) => theme.text1};
  border-radius: 0;
  border-left: ${({ theme, isActive }) => (isActive ? `2px solid ${theme.primary1}` : 'none')};

  &:hover {
    text-decoration: none;
  }

  &:focus {
    text-decoration: none;
  }
`

const Farms = () => {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const { loading: publicDataLoading, error: publicDataError, data: allFarms } = useFarmsPublicData()
  const { loading: userFarmsLoading, data: farmsUserData } = useFarmsUserData(account, allFarms)
  const [activeTab, setActiveTab] = useState(0)

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

  console.log('farms', farms)

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

        <Panel>{activeTab === 0 ? <FarmsList farms={allFarms} /> : <div>Vesting</div>}</Panel>
      </PageWrapper>
      <FarmClaimModal />
      <FarmStakeModal />
    </>
  )
}

export default Farms
