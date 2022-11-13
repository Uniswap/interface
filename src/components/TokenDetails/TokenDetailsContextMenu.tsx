import { Currency } from '@uniswap/sdk-core'
import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import ContextMenu from 'react-native-context-menu-view'
import { useAppSelector } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TripleDot } from 'src/components/icons/TripleDot'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { currencyId } from 'src/utils/currencyId'
import { logger } from 'src/utils/logger'

type TokenDetailsContextMenuProps = {
  currency: Currency
}

export function TokenDetailsContextMenu({ currency }: TokenDetailsContextMenuProps) {
  const { t } = useTranslation()

  const id = currencyId(currency).toLowerCase()
  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(id)
  const onFavoritePress = useToggleFavoriteCallback(id)

  const menuActions = useMemo(
    () => [
      {
        title: isFavoriteToken ? t('Remove favorite') : t('Favorite token'),
        systemIcon: isFavoriteToken ? 'star.fill' : 'star',
      },
    ],
    [isFavoriteToken, t]
  )

  return (
    <ContextMenu
      actions={menuActions}
      dropdownMenuMode={true}
      onPress={(e) => {
        switch (e.nativeEvent.index) {
          case 0:
            onFavoritePress()
            break
          default:
            logger.error(
              'TokenDetailsContextMenu',
              'onPress',
              `Unexpected context menu index: ${e.nativeEvent.index}`
            )
        }
      }}>
      <TouchableArea px="xxxs" py="sm">
        <TripleDot />
      </TouchableArea>
    </ContextMenu>
  )
}
