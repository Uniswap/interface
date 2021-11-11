import React from 'react'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'

import { ButtonEmpty } from 'components/Button'
import InfoHelper from 'components/InfoHelper'

const TabContainer = styled.div`
  display: flex;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.buttonBlack};
`

const Tab = styled(ButtonEmpty)<{ isActive?: boolean; isLeft?: boolean }>`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  background-color: ${({ theme, isActive }) => (isActive ? theme.primary1 : theme.buttonBlack)};
  padding: 8px;
  border-radius: ${({ isLeft }) => (isLeft ? '20px 0 0 20px' : '0 20px 20px 0')};
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;

  &:hover {
    text-decoration: none;
  }
`

const TabText = styled.div<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 2px;
  color: ${({ theme, isActive }) => (isActive ? 'white' : theme.subText)};
`

const LiquidityProviderMode = ({
  activeTab,
  setActiveTab,
  singleTokenInfo
}: {
  activeTab: number
  setActiveTab: (activeTab: number) => void
  singleTokenInfo: string
}) => {
  return (
    <TabContainer>
      <Tab isActive={activeTab === 0} isLeft padding="0" onClick={() => setActiveTab(0)}>
        <TabText isActive={activeTab === 0}>
          <Trans>Single Token</Trans>
          <InfoHelper text={singleTokenInfo} size={18} isActive={activeTab === 0} />
        </TabText>
      </Tab>
      <Tab isActive={activeTab === 1} padding="0" onClick={() => setActiveTab(1)}>
        <TabText isActive={activeTab === 1}>
          <Trans>Token Pair</Trans>
        </TabText>
      </Tab>
    </TabContainer>
  )
}

export default LiquidityProviderMode
