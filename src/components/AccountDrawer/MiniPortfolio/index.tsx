import { Trans } from '@lingui/macro'
import { Trace, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceSectionName, SharedEventName } from '@uniswap/analytics-events'
import Column from 'components/Column'
import { AutoRow } from 'components/Row'
import { useMiniPortfolioEnabled } from 'featureFlags/flags/miniPortfolio'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useAtomValue } from 'jotai/utils'
import { useState } from 'react'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ActivityTab } from './Activity'
import NFTs from './NFTs'
import Pools from './Pools'
import { PortfolioRowWrapper } from './PortfolioRow'
import Tokens from './Tokens'

const Wrapper = styled(Column)`
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 12px;

  ${PortfolioRowWrapper} {
    &:hover {
      background: ${({ theme }) => theme.hoverDefault};
    }
  }
`

const Nav = styled(AutoRow)`
  gap: 20px;
`

const NavItem = styled(ThemedText.SubHeader)<{ active?: boolean }>`
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textTertiary)};
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} color`};

  &:hover {
    ${({ theme, active }) => !active && `color: ${theme.textSecondary}`};
    cursor: pointer;
  }
`

const PageWrapper = styled.div`
  border-radius: 12px;
  margin-right: -16px;
  margin-left: -16px;
  width: calc(100% + 32px);
  flex: 1;
`

interface Page {
  title: React.ReactNode
  key: string
  component: ({ account }: { account: string }) => JSX.Element
  loggingElementName: string
}

const Pages: Array<Page> = [
  {
    title: <Trans>Tokens</Trans>,
    key: 'tokens',
    component: Tokens,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_TOKENS_TAB,
  },
  {
    title: <Trans>NFTs</Trans>,
    key: 'nfts',
    component: NFTs,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_NFT_TAB,
  },
  {
    title: <Trans>Pools</Trans>,
    key: 'pools',
    component: Pools,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_POOLS_TAB,
  },
  {
    title: <Trans>Activity</Trans>,
    key: 'activity',
    component: ActivityTab,
    loggingElementName: InterfaceElementName.MINI_PORTFOLIO_ACTIVITY_TAB,
  },
]

function MiniPortfolio({ account }: { account: string }) {
  const isNftPage = useIsNftPage()
  const [currentPage, setCurrentPage] = useState(isNftPage ? 1 : 0)
  const shouldDisableNFTRoutes = useAtomValue(shouldDisableNFTRoutesAtom)

  const Page = Pages[currentPage].component
  return (
    <Wrapper>
      <Nav>
        {Pages.map(({ title, loggingElementName, key }, index) => {
          if (shouldDisableNFTRoutes && loggingElementName.includes('nft')) return null
          return (
            <TraceEvent
              events={[BrowserEvent.onClick]}
              name={SharedEventName.NAVBAR_CLICKED}
              element={loggingElementName}
              key={index}
            >
              <NavItem
                data-testid={`mini-portfolio-nav-${key}`}
                onClick={() => setCurrentPage(index)}
                active={currentPage === index}
                key={`Mini Portfolio page ${index}`}
              >
                {title}
              </NavItem>
            </TraceEvent>
          )
        })}
      </Nav>
      <PageWrapper>
        <Page account={account} />
      </PageWrapper>
    </Wrapper>
  )
}

export default function MiniPortfolioWrapper({ account }: { account: string }) {
  const flagEnabled = useMiniPortfolioEnabled()
  if (!flagEnabled) return null

  return (
    <Trace section={InterfaceSectionName.MINI_PORTFOLIO}>
      <MiniPortfolio account={account} />
    </Trace>
  )
}
