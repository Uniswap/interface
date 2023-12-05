import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch } from 'src/app/hooks'
import {
  getTokensOrderByMenuLabel,
  getTokensOrderBySelectedLabel,
} from 'src/features/explore/utils'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { disableOnPress } from 'src/utils/disableOnPress'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { logger } from 'utilities/src/logger/logger'
import { TokenSortableField } from 'wallet/src/data/__generated__/types-and-hooks'
import { useIsDarkMode } from 'wallet/src/features/appearance/hooks'
import { setTokensOrderBy } from 'wallet/src/features/wallet/slice'
import { ClientTokensOrderBy, TokensOrderBy } from 'wallet/src/features/wallet/types'
interface FilterGroupProps {
  orderBy: TokensOrderBy
}

function _SortButton({ orderBy }: FilterGroupProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const menuActions = useMemo(() => {
    return [
      {
        title: getTokensOrderByMenuLabel(TokenSortableField.Volume, t),
        systemIcon: orderBy === TokenSortableField.Volume ? 'checkmark' : '',
        orderBy: TokenSortableField.Volume,
      },
      {
        title: getTokensOrderByMenuLabel(TokenSortableField.TotalValueLocked, t),
        systemIcon: orderBy === TokenSortableField.TotalValueLocked ? 'checkmark' : '',
        orderBy: TokenSortableField.TotalValueLocked,
      },
      {
        title: getTokensOrderByMenuLabel(TokenSortableField.MarketCap, t),
        systemIcon: orderBy === TokenSortableField.MarketCap ? 'checkmark' : '',
        orderBy: TokenSortableField.MarketCap,
      },
      {
        title: getTokensOrderByMenuLabel(ClientTokensOrderBy.PriceChangePercentage24hDesc, t),
        systemIcon: orderBy === ClientTokensOrderBy.PriceChangePercentage24hDesc ? 'checkmark' : '',
        orderBy: ClientTokensOrderBy.PriceChangePercentage24hDesc,
      },
      {
        title: getTokensOrderByMenuLabel(ClientTokensOrderBy.PriceChangePercentage24hAsc, t),
        systemIcon: orderBy === ClientTokensOrderBy.PriceChangePercentage24hAsc ? 'checkmark' : '',
        orderBy: ClientTokensOrderBy.PriceChangePercentage24hAsc,
      },
    ]
  }, [t, orderBy])

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={(e): void => {
        const selectedMenuAction = menuActions[e.nativeEvent.index]
        // Handle switching selected sort option
        if (!selectedMenuAction) {
          logger.error('Unexpected context menu index selected', {
            tags: { file: 'SortButton', function: 'SortButtonContextMenu:onPress' },
          })
          return
        }

        dispatch(setTokensOrderBy({ newTokensOrderBy: selectedMenuAction.orderBy }))
        sendMobileAnalyticsEvent(MobileEventName.ExploreFilterSelected, {
          filter_type: selectedMenuAction.orderBy,
        })
      }}>
      <TouchableArea
        alignItems="center"
        backgroundColor={isDarkMode ? '$DEP_backgroundOverlay' : '$surface1'}
        borderRadius="$roundedFull"
        flexDirection="row"
        px="$spacing16"
        py="$spacing8"
        onLongPress={disableOnPress}>
        <Flex row gap="$spacing4">
          {orderBy === TokenSortableField.Volume || orderBy === TokenSortableField.TotalValueLocked}
          <Text color="$neutral2" variant="buttonLabel3">
            {getTokensOrderBySelectedLabel(orderBy, t)}
          </Text>
          <Icons.RotatableChevron
            color="$neutral2"
            direction="down"
            height={iconSizes.icon20}
            width={iconSizes.icon20}
          />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}

export const SortButton = memo(_SortButton)
