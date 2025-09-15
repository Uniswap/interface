import { usePortfolioParams } from 'pages/Portfolio/Header/hooks/usePortfolioParams'
import { PortfolioTabInfo, usePortfolioTabs } from 'pages/Portfolio/Header/hooks/usePortfolioTabs'
import { useLocation, useNavigate } from 'react-router'
import { Flex, Separator, Text, TouchableArea } from 'ui/src'
import { getCurrentPageFromLocation } from 'utils/urlRoutes'

export function PortfolioTabs() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { chainName } = usePortfolioParams()
  const portfolioTabs = usePortfolioTabs()

  return (
    <Flex paddingHorizontal="$spacing24">
      <Flex row gap="$spacing24">
        {portfolioTabs.map((tab: PortfolioTabInfo) => {
          const tabPath = chainName ? `${tab.path}?chain=${chainName}` : tab.path
          const currentPage = getCurrentPageFromLocation(pathname)
          const isActive = currentPage === tab.pageName
          return (
            <TouchableArea
              key={tab.path}
              onPress={() => navigate(tabPath)}
              role="link"
              tag="a"
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
            </TouchableArea>
          )
        })}
      </Flex>
      <Separator />
    </Flex>
  )
}
