import { Pair } from 'dxswap-sdk'
import React, { useCallback, useState } from 'react'
import { TYPE } from '../../../../theme'
import { AutoColumn } from '../../../Column'
import TabBar from '../../../TabBar'
import List from './List'
import ActiveTab from './Tabs/Active'
import ExpiredTab from './Tabs/Expired'
import UpcomingTab from './Tabs/Upcoming'

interface LiquidityMiningCampaignsListProps {
  pair?: Pair
}

const TAB_TITLES = ['Active', 'Upcoming', 'Expired (30 days)']

export default function LiquidityMiningCampaigns({ pair }: LiquidityMiningCampaignsListProps) {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabChange = useCallback(newActiveTab => {
    setActiveTab(newActiveTab)
  }, [])

  return (
    <AutoColumn gap="16px">
      <TYPE.mediumHeader fontSize="18px" color="white">
        Reward pools
      </TYPE.mediumHeader>
      <TabBar titles={TAB_TITLES} active={activeTab} onChange={handleTabChange} />
      {pair ? (
        <>
          {activeTab === 0 && <ActiveTab pair={pair} />}
          {activeTab === 1 && <UpcomingTab pair={pair} />}
          {activeTab === 2 && <ExpiredTab pair={pair} />}
        </>
      ) : (
        <List loading />
      )}
    </AutoColumn>
  )
}
