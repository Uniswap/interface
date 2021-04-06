import { Pair } from 'dxswap-sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../../../hooks'
import { TYPE } from '../../../../theme'
import { AutoColumn } from '../../../Column'
import TabBar from '../../../TabBar'
import List from './List'
import ActiveTab from './Tabs/Active'
import ConnectedAccountTab from './Tabs/ConnectedAccount'
import ExpiredTab from './Tabs/Expired'
import UpcomingTab from './Tabs/Upcoming'

interface LiquidityMiningCampaignsListProps {
  pair?: Pair
}

const INITIAL_TAB_TITLES = ['Active', 'Upcoming', 'Expired (30 days)']

export default function LiquidityMiningCampaigns({ pair }: LiquidityMiningCampaignsListProps) {
  const { account } = useActiveWeb3React()

  const [tabTitles, setTabTitles] = useState(INITIAL_TAB_TITLES)
  const [activeTab, setActiveTab] = useState(account ? 0 : 1)

  const handleTabChange = useCallback(
    newActiveTab => {
      setActiveTab(account ? newActiveTab : newActiveTab + 1)
    },
    [account]
  )

  useEffect(() => {
    if (account) setTabTitles(['Your positions', ...INITIAL_TAB_TITLES])
    else setTabTitles(INITIAL_TAB_TITLES)
  }, [account])

  return (
    <AutoColumn gap="16px">
      <TYPE.mediumHeader fontSize="18px" color="white">
        Reward pools
      </TYPE.mediumHeader>
      <TabBar titles={tabTitles} active={account ? activeTab : activeTab - 1} onChange={handleTabChange} />
      {pair ? (
        <>
          {activeTab === 0 && <ConnectedAccountTab pair={pair} />}
          {activeTab === 1 && <ActiveTab pair={pair} />}
          {activeTab === 2 && <UpcomingTab pair={pair} />}
          {activeTab === 3 && <ExpiredTab pair={pair} />}
        </>
      ) : (
        <List loading />
      )}
    </AutoColumn>
  )
}
