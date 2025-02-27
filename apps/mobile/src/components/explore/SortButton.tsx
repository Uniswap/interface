import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getTokensOrderByMenuLabel, getTokensOrderBySelectedLabel } from 'src/features/explore/utils'
import { Flex, Text, useSporeColors } from 'ui/src'
import {
  Chart,
  ChartPie,
  ChartPyramid,
  CheckCircleFilled,
  RotatableChevron,
  TrendDown,
  TrendUp,
} from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { CustomRankingType, RankingType } from 'uniswap/src/data/types'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'

const MIN_MENU_ITEM_WIDTH = 220

interface FilterGroupProps {
  orderBy: ExploreOrderBy
  onOrderByChange: (orderBy: ExploreOrderBy) => void
}

function _SortButton({ orderBy, onOrderByChange }: FilterGroupProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const menuActions = useMemo(() => {
    return [
      {
        title: getTokensOrderByMenuLabel(RankingType.Volume, t),
        orderBy: RankingType.Volume,
        icon: <Chart color={colors.neutral2.val} size={iconSizes.icon16} />,
        active: orderBy === RankingType.Volume,
      },
      {
        title: getTokensOrderByMenuLabel(RankingType.TotalValueLocked, t),
        orderBy: RankingType.TotalValueLocked,
        icon: <ChartPyramid color={colors.neutral2.val} size={iconSizes.icon16} />,
        active: orderBy === RankingType.TotalValueLocked,
      },
      {
        title: getTokensOrderByMenuLabel(RankingType.MarketCap, t),
        orderBy: RankingType.MarketCap,
        icon: <ChartPie color={colors.neutral2.val} size={iconSizes.icon16} />,
        active: orderBy === RankingType.MarketCap,
      },
      {
        title: getTokensOrderByMenuLabel(CustomRankingType.PricePercentChange1DayDesc, t),
        orderBy: CustomRankingType.PricePercentChange1DayDesc,
        icon: <TrendUp color={colors.neutral2.val} size={iconSizes.icon16} />,
        active: orderBy === CustomRankingType.PricePercentChange1DayDesc,
      },
      {
        title: getTokensOrderByMenuLabel(CustomRankingType.PricePercentChange1DayAsc, t),
        orderBy: CustomRankingType.PricePercentChange1DayAsc,
        icon: <TrendDown color={colors.neutral2.val} size={iconSizes.icon16} />,
        active: orderBy === CustomRankingType.PricePercentChange1DayAsc,
      },
    ]
  }, [t, colors.neutral2.val, orderBy])

  const MenuItem = useCallback(({ label, icon, active }: { label: string; icon: JSX.Element; active: boolean }) => {
    return (
      <Flex
        grow
        row
        alignItems="center"
        gap="$spacing8"
        minWidth={MIN_MENU_ITEM_WIDTH}
        py="$spacing8"
        style={{ padding: 5 }}
      >
        {icon && icon}
        <Text>{label}</Text>
        {active && <CheckCircleFilled color="$neutral1" size="$icon.16" />}
      </Flex>
    )
  }, [])

  const handleOrderByChange = useCallback(
    (newOrderBy: ExploreOrderBy) => {
      onOrderByChange(newOrderBy)
      sendAnalyticsEvent(MobileEventName.ExploreFilterSelected, {
        filter_type: newOrderBy,
      })
    },
    [onOrderByChange],
  )

  const options = useMemo<MenuItemProp[]>(() => {
    return menuActions.map((option, index) => {
      return {
        key: index.toString(),
        onPress: (): void => {
          const selectedMenuAction = menuActions[index]
          if (!selectedMenuAction) {
            logger.error(new Error('Unexpected context menu index selected'), {
              tags: { file: 'SortButton', function: 'SortButtonContextMenu:onPress' },
            })
            return
          }
          handleOrderByChange(selectedMenuAction.orderBy)
        },
        render: () => <MenuItem active={option.active} icon={option.icon} label={option.title} />,
      }
    })
  }, [MenuItem, menuActions, handleOrderByChange])

  return (
    <ActionSheetDropdown options={options} showArrow={false} styles={{ alignment: 'right' }}>
      <Flex
        row
        centered
        backgroundColor="$surface3"
        borderRadius="$rounded20"
        gap="$spacing4"
        pl="$spacing12"
        pr="$spacing8"
        py="$spacing8"
      >
        <Text ellipse color="$neutral2" flexShrink={1} numberOfLines={1} variant="buttonLabel3">
          {getTokensOrderBySelectedLabel(orderBy, t)}
        </Text>
        <RotatableChevron color="$neutral2" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
      </Flex>
    </ActionSheetDropdown>
  )
}

export const SortButton = memo(_SortButton)
