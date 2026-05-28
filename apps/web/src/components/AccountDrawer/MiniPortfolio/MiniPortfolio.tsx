import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import type { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import type { DataApiOutageState } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { filterTransactionDetailsFromActivityItems } from '~/pages/Portfolio/Activity/Filters/utils'
import { ViewAllButton } from '~/pages/Portfolio/Overview/ViewAllButton'
import { filterDefinedWalletAddresses } from '~/utils/filterDefinedWalletAddresses'

const MAX_RECENT_ACTIVITY_ITEMS = 3

export function MiniPortfolio({
  evmAddress,
  svmAddress,
  onActivityOutageChange,
}: {
  evmAddress?: string
  svmAddress?: string
  onActivityOutageChange?: (outage: DataApiOutageState) => void
}) {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()

  const { renderActivityItem, sectionData, error, dataUpdatedAt } = useActivityData({
    evmOwner: evmAddress,
    svmOwner: svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
    fiatOnRampParams: undefined,
    skip: false,
  })

  useEffect(() => {
    onActivityOutageChange?.({ error, dataUpdatedAt })
    return () => onActivityOutageChange?.({ error: undefined, dataUpdatedAt: undefined })
  }, [error, dataUpdatedAt, onActivityOutageChange])

  const recentActivityItems = useMemo(() => {
    // Filter out section headers and loading items, then get the first 3 actual activity items
    const actualActivityItems = filterTransactionDetailsFromActivityItems(sectionData ?? []).slice(
      0,
      MAX_RECENT_ACTIVITY_ITEMS,
    )
    return actualActivityItems.map((item: ActivityItem, index) => {
      return renderActivityItem({
        item,
        index,
      })
    })
  }, [sectionData, renderActivityItem])

  return (
    <Flex mt="$spacing12" gap="$spacing4">
      <ViewAllButton
        label={t('portfolio.view')}
        elementName={ElementName.MiniPortfolioViewPortfolioButton}
        href="/portfolio"
        onPress={accountDrawer.close}
        fullWidth
      />

      <Flex gap="$spacing8" pt="$spacing16">
        <Text variant="subheading2" color="$neutral1" p="$spacing8">
          {t('activity.recentActivity')}
        </Text>
        <Flex gap="$spacing0">{recentActivityItems}</Flex>
      </Flex>

      <ViewAllButton
        label={t('portfolio.overview.activity.table.viewAllActivity')}
        elementName={ElementName.PortfolioViewAllActivity}
        href="/portfolio/activity"
        onPress={accountDrawer.close}
      />
    </Flex>
  )
}
