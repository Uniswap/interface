import React from 'react'
import { Trans } from '@lingui/macro'

import InfoHelper from 'components/InfoHelper'
import { TabContainer, TabItem } from 'components/PoolList/styled'
import styled from 'styled-components'
import useTheme from 'hooks/useTheme'

const Tab = styled(TabItem)`
  padding: 8px;
`

const LiquidityProviderMode = ({
  activeTab,
  setActiveTab,
  singleTokenInfo,
}: {
  activeTab: number
  setActiveTab: (activeTab: number) => void
  singleTokenInfo: string
}) => {
  const theme = useTheme()
  return (
    <TabContainer style={{ padding: '4px' }}>
      <Tab active={activeTab === 0} onClick={() => setActiveTab(0)} role="button">
        <Trans>Token Pair</Trans>
      </Tab>
      <Tab active={activeTab === 1} onClick={() => setActiveTab(1)} role="button">
        <Trans>Single Token</Trans>
        <InfoHelper
          text={singleTokenInfo}
          size={12}
          isActive={activeTab === 1}
          color={activeTab === 1 ? theme.text : theme.subText}
        />
      </Tab>
    </TabContainer>
  )
}

export default LiquidityProviderMode
