import React, { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { getTokensOrderByMenuLabel, getTokensOrderBySelectedLabel } from 'src/features/explore/utils'
import { Flex, Text, useIsDarkMode } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { TokenSortableField } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { setTokensOrderBy } from 'wallet/src/features/wallet/slice'
import { ClientTokensOrderBy, TokensOrderBy } from 'wallet/src/features/wallet/types'

interface FilterGroupProps {
  orderBy: TokensOrderBy
}

function _SortButton({ orderBy }: FilterGroupProps): JSX.Element {
  const isDarkMode = useIsDarkMode()
  const dispatch = useDispatch()
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

  const MenuItem = useCallback(({ label }: { label: string }) => {
    return (
      <Flex grow style={{ padding: 5 }}>
        <Text>{label}</Text>
      </Flex>
    )
  }, [])

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
          dispatch(setTokensOrderBy({ newTokensOrderBy: option.orderBy }))
          sendAnalyticsEvent(MobileEventName.ExploreFilterSelected, {
            filter_type: selectedMenuAction.orderBy,
          })
        },
        render: () => <MenuItem label={option.title} />,
      }
    })
  }, [MenuItem, dispatch, menuActions])

  return (
    <ActionSheetDropdown
      options={options}
      showArrow={false}
      styles={{
        alignment: 'right',
      }}
      testID="chain-selector"
      onDismiss={() => {}}
    >
      <Flex
        row
        backgroundColor={isDarkMode ? '$DEP_backgroundOverlay' : '$surface1'}
        borderRadius="$rounded20"
        gap="$spacing4"
        px="$spacing16"
        py="$spacing8"
      >
        <Text ellipse color="$neutral2" flexShrink={1} numberOfLines={1} variant="buttonLabel2">
          {getTokensOrderBySelectedLabel(orderBy, t)}
        </Text>
        <RotatableChevron color="$neutral2" direction="down" height={iconSizes.icon20} width={iconSizes.icon20} />
      </Flex>
    </ActionSheetDropdown>
  )
}

export const SortButton = memo(_SortButton)
