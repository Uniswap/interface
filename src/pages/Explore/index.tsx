import { Trans } from '@lingui/macro'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Trace } from 'analytics'
import { useState } from 'react'
import styled from 'styled-components'
import { ThemedText } from 'theme'
import { ProtocolStats } from './ProtocolStats'
import { PoolsTable } from './PoolsTable'
import TokenTable from 'components/Tokens/TokenTable/TokenTable'

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 68px 12px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding-top: 48px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
`

const TitleContainer = styled.div`
  margin-bottom: 32px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  display: flex;
`

const TabsContainer = styled.div`
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
  border-bottom: 1px solid ${({ theme }) => theme.surface3};
`

const Tab = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 535;
  color: ${({ theme, $active }) => ($active ? theme.neutral1 : theme.neutral2)};
  border-bottom: 2px solid ${({ theme, $active }) => ($active ? theme.accent1 : 'transparent')};
  transition: color 0.2s ease;

  &:hover {
    color: ${({ theme }) => theme.neutral1};
  }
`

const ContentContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
`

type ExploreTab = 'tokens' | 'pools'

export default function Explore() {
  const [activeTab, setActiveTab] = useState<ExploreTab>('tokens')

  return (
    <Trace page={InterfacePageName.EXPLORE_PAGE} shouldLogImpression>
      <ExploreContainer>
        <TitleContainer>
          <ThemedText.LargeHeader>
            <Trans>Explore Taiko Swap</Trans>
          </ThemedText.LargeHeader>
        </TitleContainer>

        {/* Protocol Stats */}
        <ProtocolStats />

        {/* Tabs */}
        <TabsContainer>
          <Tab $active={activeTab === 'tokens'} onClick={() => setActiveTab('tokens')}>
            <Trans>Tokens</Trans>
          </Tab>
          <Tab $active={activeTab === 'pools'} onClick={() => setActiveTab('pools')}>
            <Trans>Pools</Trans>
          </Tab>
        </TabsContainer>

        {/* Content */}
        <ContentContainer>
          {activeTab === 'tokens' && <TokenTable />}
          {activeTab === 'pools' && <PoolsTable />}
        </ContentContainer>
      </ExploreContainer>
    </Trace>
  )
}
