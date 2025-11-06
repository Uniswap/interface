import { usePortfolioRoutes } from 'pages/Portfolio/Header/hooks/usePortfolioRoutes'
import { PortfolioTabInfo, usePortfolioTabs } from 'pages/Portfolio/Header/hooks/usePortfolioTabs'
import { Link, useLocation } from 'react-router'
import { Flex, Separator, Text } from 'ui/src'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export function PortfolioTabs() {
  const { pathname } = useLocation()
  const { chainName } = usePortfolioRoutes()
  const portfolioTabs = usePortfolioTabs()

  return (
    <Flex>
      <Flex row gap="$spacing24">
        {portfolioTabs.map((tab: PortfolioTabInfo) => {
          const tabPath = chainName ? `${tab.path}?chain=${chainName}` : tab.path
          const currentPage = getCurrentPageFromLocation(pathname)
          const isActive = currentPage === tab.pageName

          return (
            <Link
              to={tabPath}
              key={tab.path}
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
          )
        })}
      </Flex>
      <Separator />
    </Flex>
  )
}
