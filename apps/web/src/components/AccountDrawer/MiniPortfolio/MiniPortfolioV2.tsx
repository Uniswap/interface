import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { filterTransactionDetailsFromActivityItems } from 'pages/Portfolio/Activity/Filters/utils'
import { ViewAllButton } from 'pages/Portfolio/Overview/ViewAllButton'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, Text } from 'ui/src'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { iconSizes } from 'ui/src/theme'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { filterDefinedWalletAddresses } from 'utils/filterDefinedWalletAddresses'

const MAX_RECENT_ACTIVITY_ITEMS = 3

export default function MiniPortfolioV2({ evmAddress, svmAddress }: { evmAddress?: string; svmAddress?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const accountDrawer = useAccountDrawer()

  const handleViewPortfolio = useCallback(() => {
    navigate('/portfolio')
    accountDrawer.close()
  }, [navigate, accountDrawer])

  const handleViewActivity = useCallback(() => {
    navigate('/portfolio/activity')
    accountDrawer.close()
  }, [navigate, accountDrawer])

  const { renderActivityItem, sectionData } = useActivityData({
    evmOwner: evmAddress,
    svmOwner: svmAddress,
    ownerAddresses: filterDefinedWalletAddresses([evmAddress, svmAddress]),
    fiatOnRampParams: undefined,
    skip: false,
  })

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
      <Button
        emphasis="tertiary"
        onPress={handleViewPortfolio}
        justifyContent="center"
        size="large"
        borderRadius="$rounded12"
        iconPosition="after"
      >
        <RightArrow size={iconSizes.icon16} color="$neutral1" />
        <Text variant="buttonLabel3" color="$neutral1">
          {t('portfolio.view')}
        </Text>
      </Button>

      <Flex gap="$spacing8" pt="$spacing16">
        <Text variant="subheading2" color="$neutral1" p="$spacing8">
          {t('activity.recentActivity')}
        </Text>
        <Flex gap="$spacing0">{recentActivityItems}</Flex>
      </Flex>

      <ViewAllButton
        label={t('portfolio.overview.activity.table.viewAllActivity')}
        elementName={ElementName.PortfolioViewAllActivity}
        onPress={handleViewActivity}
      />
    </Flex>
  )
}
