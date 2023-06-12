import { Trans } from '@lingui/macro'
import { Trace, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, InterfaceSectionName, SharedEventName } from '@uniswap/analytics-events'
import Column from 'components/Column'
import { LoaderV2 } from 'components/Icons/LoadingSpinner'
import { AutoRow } from 'components/Row'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useAtomValue } from 'jotai/utils'
import { useMemo, useState } from 'react'
import { shouldDisableNFTRoutesAtom } from 'state/application/atoms'
import { useAllTransactions } from 'state/transactions/hooks'
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
  align-items: center;
  color: ${({ theme, active }) => (active ? theme.textPrimary : theme.textTertiary)};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} color`};

  &:hover {
    ${({ theme, active }) => !active && `color: ${theme.textSecondary}`};
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

export default function MiniPortfolio({ account }: { account: string }) {
  const isNftPage = useIsNftPage()
  const [currentPage, setCurrentPage] = useState(isNftPage ? 1 : 0)
  const shouldDisableNFTRoutes = useAtomValue(shouldDisableNFTRoutesAtom)

  const Page = Pages[currentPage].component

  const allTransactions = useAllTransactions()
  const hasPendingTransactions = useMemo(() => {
    return Object.values(allTransactions).filter((tx) => !tx.receipt).length > 0
  }, [allTransactions])
  return (
    <Trace section={InterfaceSectionName.MINI_PORTFOLIO}>
      <Wrapper>
        <Nav data-testid="mini-portfolio-navbar">
          {Pages.map(({ title, loggingElementName, key }, index) => {
            if (shouldDisableNFTRoutes && loggingElementName.includes('nft')) return null
            const showPendingActivitySpinner = Boolean(key === 'activity' && hasPendingTransactions)
            return (
              <TraceEvent
                events={[BrowserEvent.onClick]}
                name={SharedEventName.NAVBAR_CLICKED}
                element={loggingElementName}
                key={index}
              >
                <NavItem onClick={() => setCurrentPage(index)} active={currentPage === index} key={key}>
                  <span>{title}</span>{' '}
                  {showPendingActivitySpinner && (
                    <>
                      &nbsp;
                      <LoaderV2 />
                    </>
                  )}
                </NavItem>
              </TraceEvent>
            )
          })}
        </Nav>
        <PageWrapper data-testid="mini-portfolio-page">
          <Page account={account} />
        </PageWrapper>
      </Wrapper>
    </Trace>
  )
}
