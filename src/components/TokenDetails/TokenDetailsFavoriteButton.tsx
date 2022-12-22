import React from 'react'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import HeartIcon from 'src/assets/icons/heart.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'

export function TokenDetailsFavoriteButton({ currencyId }: { currencyId: string }) {
  const theme = useAppTheme()

  const id = currencyId.toLowerCase()
  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(id)
  const onFavoritePress = useToggleFavoriteCallback(id)

  return (
    <TouchableArea hapticFeedback onPress={onFavoritePress}>
      <HeartIcon
        fill={isFavoriteToken ? theme.colors.accentAction : theme.colors.none}
        height={theme.iconSizes.lg}
        stroke={isFavoriteToken ? theme.colors.accentAction : theme.colors.textSecondary}
        strokeWidth={2}
        width={theme.iconSizes.lg}
      />
    </TouchableArea>
  )
}
