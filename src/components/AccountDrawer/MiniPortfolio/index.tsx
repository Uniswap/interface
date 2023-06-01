import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import { AutoRow } from 'components/Row'
import { useMiniPortfolioEnabled } from 'featureFlags/flags/miniPortfolio'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useState } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ActivityTab } from './Activity'
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
}

const Pages: Array<Page> = [
  {
    title: <Trans>Tokens</Trans>,
    key: 'tokens',
    component: Tokens,
  },
  // {
  //   title: <Trans>NFTs</Trans>,
  //   key: 'nfts',
  //   component: NFTs,
  //   loggingElementName: InterfaceElementName.MINI_PORTFOLIO_NFT_TAB,
  // },
  {
    title: <Trans>Pools</Trans>,
    key: 'pools',
    component: Pools,
  },
  {
    title: <Trans>Activity</Trans>,
    key: 'activity',
    component: ActivityTab,
  },
]

function MiniPortfolio({ account }: { account: string }) {
  const isNftPage = useIsNftPage()
  const [currentPage, setCurrentPage] = useState(isNftPage ? 1 : 0)

  const Page = Pages[currentPage].component
  return (
    <Wrapper>
      <Nav>
        {Pages.map(({ title, key }, index) => {
          return (
            <NavItem
              data-testid={`mini-portfolio-nav-${key}`}
              onClick={() => setCurrentPage(index)}
              active={currentPage === index}
              key={`Mini Portfolio page ${index}`}
            >
              {title}
            </NavItem>
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

  return <MiniPortfolio account={account} />
}
