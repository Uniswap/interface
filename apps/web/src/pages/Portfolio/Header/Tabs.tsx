import { Link } from 'react-router'
import { Flex, Separator, Text } from 'ui/src'
import { ElementName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { usePortfolioRoutes } from '~/pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioTabInfo, usePortfolioTabs } from '~/pages/Portfolio/Header/hooks/usePortfolioTabs'
import { PortfolioTab } from '~/pages/Portfolio/types'
import { buildPortfolioUrl, pathToPortfolioTab } from '~/pages/Portfolio/utils/portfolioUrls'

const PORTFOLIO_TAB_TEST_IDS: Record<PortfolioTab, string> = {
  [PortfolioTab.Overview]: TestID.PortfolioTabOverview,
  [PortfolioTab.Tokens]: TestID.PortfolioTabTokens,
  [PortfolioTab.Defi]: TestID.PortfolioTabDefi,
  [PortfolioTab.Nfts]: TestID.PortfolioTabNfts,
  [PortfolioTab.Activity]: TestID.PortfolioTabActivity,
}

function getTabElementName(pageName: InterfacePageName): ElementName {
  switch (pageName) {
    case InterfacePageName.PortfolioPage:
      return ElementName.PortfolioOverviewTab
    case InterfacePageName.PortfolioTokensPage:
      return ElementName.PortfolioTokensTab
    case InterfacePageName.PortfolioDefiPage:
      return ElementName.PortfolioDefiTab
    case InterfacePageName.PortfolioNftsPage:
      return ElementName.PortfolioNftsTab
    case InterfacePageName.PortfolioActivityPage:
      return ElementName.PortfolioActivityTab
    default:
      return ElementName.PortfolioOverviewTab
  }
}

export function PortfolioTabs() {
  const { chainId, externalAddress, tab: currentTab } = usePortfolioRoutes()
  const portfolioTabs = usePortfolioTabs()

  return (
    <Flex>
      <Flex row gap="$spacing24" $sm={{ gap: '$spacing12', justifyContent: 'space-around' }}>
        {portfolioTabs.map((tab: PortfolioTabInfo) => {
          const portfolioTab = pathToPortfolioTab(tab.path)
          const tabPath = buildPortfolioUrl({ tab: portfolioTab, chainId, externalAddress: externalAddress?.address })
          // Compare with the current tab from usePortfolioRoutes which handles external wallet URLs
          const isActive = portfolioTab === currentTab
          const elementName = getTabElementName(tab.pageName)

          return (
            <Trace key={tab.path} logPress element={elementName}>
              <Link
                to={tabPath}
                style={{ textDecoration: 'none', paddingBottom: 12 }}
                aria-label={`Navigate to ${tab.label}`}
                data-testid={portfolioTab && PORTFOLIO_TAB_TEST_IDS[portfolioTab]}
              >
                <Text
                  variant="body2"
                  fontWeight={400}
                  color={isActive ? '$neutral1' : '$neutral2'}
                  pb="$padding12"
                  borderBottomWidth="$spacing2"
                  borderBottomColor={isActive ? '$neutral1' : '$transparent'}
                  hoverStyle={{
                    color: '$neutral1',
                    borderBottomColor: '$neutral2',
                  }}
                >
                  {tab.label}
                </Text>
              </Link>
            </Trace>
          )
        })}
      </Flex>
      <Separator />
    </Flex>
  )
}
