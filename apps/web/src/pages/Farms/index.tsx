import { InterfaceElementName, InterfacePageName, SharedEventName } from '@uniswap/analytics-events'
import { AutoRow } from 'components/Row'
import { MAX_WIDTH_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { Trans } from 'i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { StyledInternalLink, ThemedText } from 'theme/components'

import { ChainId } from '@taraswap/sdk-core'
import { CHAIN_INFO, useChainFromUrlParam } from 'constants/chains'
import { manualChainOutageAtom } from 'featureFlags/flags/outageBanner'
import { useResetAtom } from 'jotai/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useExploreParams } from '../Explore/redirects'
import { TitleRow } from 'nft/components/profile/list/shared'
import Incentives from 'components/Incentives'
import Create from 'components/Create'
import FAQ from 'components/FAQ'

const ExploreContainer = styled.div`
  width: 100%;
  min-width: 320px;
  padding: 48px 40px 0px;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding: 16px;
    padding-bottom: 0px;
  }
`

const NavWrapper = styled.div`
  display: flex;
  max-width: ${MAX_WIDTH_MEDIA_BREAKPOINT};
  margin: 0 auto;
  margin-bottom: 16px;
  color: ${({ theme }) => theme.neutral3};
  flex-direction: row;
  justify-content: space-between;
  @media screen and (max-width: ${({ theme }) => `${theme.breakpoint.lg}px`}) {
    flex-direction: column;
    gap: 16px;
  }
`
const TabBar = styled(AutoRow)`
  gap: 24px;
  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    gap: 16px;
  }
`
const TabItem = styled(ThemedText.HeadlineMedium) <{ active?: boolean }>`
  align-items: center;
  color: ${({ theme, active }) => (active ? theme.neutral1 : theme.neutral2)};
  cursor: pointer;
  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} color`};

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
    font-size: 24px !important;
    line-height: 32px !important;
  }
`
const FiltersContainer = styled.div`
  display: flex;
  gap: 8px;
  height: 40px;
  justify-content: flex-start;
`

export enum LiquidityTab {
  Incentives = 'incentives',
  Create = 'create',
  FAQ = 'faq',
}

interface Page {
  title: React.ReactNode
  key: LiquidityTab
  component: () => JSX.Element
  loggingElementName: InterfaceElementName
}

const Pages: Array<Page> = [
  {
    title: <Trans i18nKey="common.incentives" />,
    key: LiquidityTab.Incentives,
    component: Incentives,
    loggingElementName: InterfaceElementName.EXPLORE_TOKENS_TAB,
  },
  {
    title: <Trans i18nKey="common.create.incentives" />,
    key: LiquidityTab.Create,
    component: Create,
    loggingElementName: InterfaceElementName.EXPLORE_POOLS_TAB,
  },
  {
    title: <Trans i18nKey="common.faq" />,
    key: LiquidityTab.FAQ,
    component: FAQ,
    loggingElementName: InterfaceElementName.EXPLORE_TRANSACTIONS_TAB,
  },
]

const Farms = ({ initialTab }: { initialTab?: LiquidityTab }) => {
  const tabNavRef = useRef<HTMLDivElement>(null)
  const resetManualOutage = useResetAtom(manualChainOutageAtom)

  const initialKey: number = useMemo(() => {
    const key = initialTab && Pages.findIndex((page) => page.key === initialTab)

    if (!key || key === -1) {
      return 0
    }
    return key
  }, [initialTab])

  useEffect(() => {
    if (tabNavRef.current && initialTab) {
      const offsetTop = tabNavRef.current.getBoundingClientRect().top + window.scrollY
      window.scrollTo({ top: offsetTop - 90, behavior: 'smooth' })
    }
    // scroll to tab navbar on initial page mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [currentTab, setCurrentTab] = useState(initialKey)

  // to allow backward navigation between tabs
  const { tab: tabName } = useExploreParams()
  const tab = tabName ?? LiquidityTab.Incentives
  const chain = useChainFromUrlParam() ?? CHAIN_INFO[ChainId.MAINNET]
  useEffect(() => {
    const tabIndex = Pages.findIndex((page) => page.key === tab)
    if (tabIndex !== -1) {
      setCurrentTab(tabIndex)
    }
    resetManualOutage()
  }, [resetManualOutage, tab])

  const { component: Page, key: currentKey } = Pages[currentTab]

  // Automatically trigger a navigation when the app chain changes
  const navigate = useNavigate()

  return (
    <Trace logImpression page={InterfacePageName.EXPLORE_PAGE} properties={{ chainName: chain.backendChain.chain }}>
      <ExploreContainer>
        {/* <ExploreChartsSection /> */}
        <NavWrapper ref={tabNavRef}>
          <FiltersContainer>
            <TitleRow padding="0">
              <ThemedText.H1Large>
                <Trans i18nKey="common.liquidity.incentives" />
              </ThemedText.H1Large>
            </TitleRow>
          </FiltersContainer>
          <TabBar data-testid="explore-navbar" justify='end' width="auto">
            {Pages.map(({ title, loggingElementName, key }, index) => {
              return (
                <Trace
                  logPress
                  eventOnTrigger={SharedEventName.NAVBAR_CLICKED}
                  element={loggingElementName}
                  key={index}
                >
                  <StyledInternalLink
                    to={`/farms/${key}`}
                  // to={`/explore/${key}`}
                  >
                    <TabItem onClick={() => setCurrentTab(index)} active={currentTab === index} key={key}>
                      {title}
                    </TabItem>
                  </StyledInternalLink>
                </Trace>
              )
            })}
          </TabBar>
        </NavWrapper>
        <Page />
      </ExploreContainer>
    </Trace>
  )
}

export default Farms
