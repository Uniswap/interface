import React, { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { useIsDarkMode } from 'src/features/appearance/hooks'
import {
  getTokensOrderByMenuLabel,
  getTokensOrderBySelectedLabel,
} from 'src/features/explore/utils'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { TokenSortableField } from 'wallet/src/data/__generated__/types-and-hooks'
import { setTokensOrderBy } from 'wallet/src/features/wallet/slice'
import { ClientTokensOrderBy, TokensOrderBy } from 'wallet/src/features/wallet/types'
interface FilterGroupProps {
  orderBy: TokensOrderBy
}

function _SortButton({ orderBy }: FilterGroupProps): JSX.Element {
  const theme = useAppTheme()
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
        backgroundColor={isDarkMode ? 'DEP_backgroundOverlay' : 'DEP_background0'}
        borderRadius="roundedFull"
        flexDirection="row"
        px="spacing12"
        py="spacing8">
        <Flex row gap="spacing4">
          {orderBy === TokenSortableField.Volume || orderBy === TokenSortableField.TotalValueLocked}
          <Text color="DEP_textSecondary" variant="buttonLabelSmall">
            {getTokensOrderBySelectedLabel(orderBy, t)}
          </Text>
          <Chevron
            color={theme.colors.DEP_textSecondary}
            direction="s"
            height={theme.iconSizes.icon20}
            width={theme.iconSizes.icon20}
          />
        </Flex>
      </TouchableArea>
    </ContextMenu>
  )
}

export const SortButton = memo(_SortButton)
