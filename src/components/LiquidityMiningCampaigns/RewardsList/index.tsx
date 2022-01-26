import React, { useState } from 'react'
import styled from 'styled-components'

import { AutoColumn } from '../../Column'
import TabBar from '../../TabBar'
import List from '../List'

import TabTitle from '../TabTitle'
import { useAllLiquidtyMiningCampaigns } from '../../../hooks/useAllLiquidtyMiningCampaigns'

import { PairsFilterType } from '../../Pool/ListFilter'
import { Pair } from '@swapr/sdk'
import { Box, Flex } from 'rebass'
import { Switch } from '../../Switch'
import { useActiveWeb3React } from '../../../hooks'
import { Button } from '../../Web3Status'
import { useWalletSwitcherPopoverToggle } from '../../../state/application/hooks'

const View = styled(AutoColumn)`
  margin-top: 20px;
`
const Container = styled('div')`
  padding: 40px 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  border: 1px solid ${({ theme }) => theme.text5};
  color: ${({ theme }) => theme.text5};
  background-color: transparent;
  font-size: 16px;
  border-radius: 6px;
`

const ConnectButton = styled(Button)`
  margin: 0;
`

interface RewardsInterface {
  dataFilter: PairsFilterType
  setDataFiler: any
  pair?: Pair | null
  loading: boolean
}

export function RewardsList({ dataFilter, pair, setDataFiler, loading }: RewardsInterface) {
  const { account } = useActiveWeb3React()
  const toggleWalletSwitcherPopover = useWalletSwitcherPopoverToggle()
  const { loading: loadingPairs, miningCampaigns } = useAllLiquidtyMiningCampaigns(pair ? pair : undefined, dataFilter)

  const [activeTab, setActiveTab] = useState(0)

  return (
    <View gap="16px">
      <Flex style={{ alignItems: 'center' }}>
        <TabBar
          titles={[
            <TabTitle
              key="active"
              loadingAmount={!account ? false : loadingPairs || loading}
              itemsAmount={!account ? 0 : miningCampaigns.active.length}
              badgeTheme="orange"
            >
              Campaigns
            </TabTitle>,
            <TabTitle
              key="active"
              loadingAmount={!account ? false : loadingPairs || loading}
              itemsAmount={!account ? 0 : miningCampaigns.expired.length}
              badgeTheme="red"
            >
              Expired (150 days)
            </TabTitle>
          ]}
          active={activeTab}
          onChange={setActiveTab}
        />
        <Switch
          style={{ marginLeft: 'auto' }}
          isOn={dataFilter === PairsFilterType.MY}
          label="MY PAIRS"
          handleToggle={() =>
            setDataFiler(dataFilter === PairsFilterType.MY ? PairsFilterType.ALL : PairsFilterType.MY)
          }
        />
      </Flex>

      {!account ? (
        <Container>
          <Box pb={4}>Wallet not connected</Box>
          <ConnectButton onClick={toggleWalletSwitcherPopover}>Connect Wallet</ConnectButton>
        </Container>
      ) : !loadingPairs && !loading ? (
        <>
          {activeTab === 0 && <List items={miningCampaigns.active} />}
          {activeTab === 1 && <List items={miningCampaigns.expired} />}
        </>
      ) : (
        <List loading />
      )}
    </View>
  )
}
