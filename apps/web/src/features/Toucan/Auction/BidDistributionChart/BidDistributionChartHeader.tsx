import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia } from 'ui/src'
import { BidDistributionChartTab } from '~/features/Toucan/Auction/AuctionChartShared'

interface BidDistributionChartHeaderProps {
  activeTab: BidDistributionChartTab
  onTabChange: (tab: BidDistributionChartTab) => void
}

interface TabConfig {
  key: BidDistributionChartTab
  label: string
}

const preloadCombinedAuctionChart = () => import('~/features/Toucan/Auction/BidDistributionChart/CombinedAuctionChart')
const preloadBidDistributionChart = () => import('~/features/Toucan/Auction/BidDistributionChart/BidDistributionChart')

export const BidDistributionChartHeader = ({
  activeTab,
  onTabChange,
}: BidDistributionChartHeaderProps): JSX.Element => {
  const { t } = useTranslation()
  const media = useMedia()

  const tabVariant = media.lg ? 'subheading1' : 'heading3'

  const tabs: TabConfig[] = useMemo(
    () => [
      {
        key: BidDistributionChartTab.ClearingPrice,
        label: t('toucan.bidDistribution.tabs.clearingPriceChart'),
      },
      {
        key: BidDistributionChartTab.Demand,
        label: t('toucan.bidDistribution.tabs.demandChart'),
      },
    ],
    [t],
  )

  const prefetchTab = useCallback((tab: BidDistributionChartTab) => {
    if (tab === BidDistributionChartTab.ClearingPrice) {
      preloadCombinedAuctionChart()
      return
    }
    preloadBidDistributionChart()
  }, [])

  // Preload the default tab (ClearingPrice / combined chart) on mount
  useEffect(() => {
    preloadCombinedAuctionChart()
  }, [])

  return (
    <Flex width="100%" mb={-6}>
      <Flex row gap="$spacing16" mb="$spacing12">
        {tabs.map(({ key, label }) => {
          const isActive = activeTab === key
          return (
            <Flex
              key={key}
              cursor="pointer"
              onMouseEnter={() => prefetchTab(key)}
              onFocus={() => prefetchTab(key)}
              onPress={() => onTabChange(key)}
            >
              <Text variant={tabVariant} color={isActive ? '$neutral1' : '$neutral2'}>
                {label}
              </Text>
            </Flex>
          )
        })}
      </Flex>
    </Flex>
  )
}
