import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioTabInfo, usePortfolioTabs } from 'pages/Portfolio/Header/hooks/usePortfolioTabs'
import { buildPortfolioUrl, pathToPortfolioTab } from 'pages/Portfolio/utils/portfolioUrls'
import { Link, useLocation } from 'react-router'
import { Flex, Separator, Text } from 'ui/src'
import { ElementName, InterfacePageName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

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
  const { pathname } = useLocation()
  const { chainId } = usePortfolioRoutes()
  const portfolioTabs = usePortfolioTabs()

  return (
    <Flex>
      <Flex row gap="$spacing24" $sm={{ gap: '$spacing12', justifyContent: 'space-around' }}>
        {portfolioTabs.map((tab: PortfolioTabInfo) => {
          const portfolioTab = pathToPortfolioTab(tab.path)
          const tabPath = buildPortfolioUrl(portfolioTab, chainId)
          const currentPage = getCurrentPageFromLocation(pathname)
          const isActive = currentPage === tab.pageName
          const elementName = getTabElementName(tab.pageName)

          return (
            <Trace key={tab.path} logPress element={elementName}>
              <Link
                to={tabPath}
                style={{ textDecoration: 'none', paddingBottom: 12 }}
                aria-label={`Navigate to ${tab.label}`}
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
