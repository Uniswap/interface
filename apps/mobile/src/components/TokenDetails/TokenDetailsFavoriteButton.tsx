import React from 'react'
import { useAppSelector } from 'src/app/hooks'
import { FavoriteButton } from 'src/components/buttons/FavoriteButton'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokens } from 'src/features/favorites/selectors'
import { iconSizes } from 'ui/src/theme/iconSizes'

export function TokenDetailsFavoriteButton({ currencyId }: { currencyId: string }): JSX.Element {
  const id = currencyId.toLowerCase()
  const isFavoriteToken = useAppSelector(selectFavoriteTokens).indexOf(id) !== -1
  const onFavoritePress = useToggleFavoriteCallback(id, isFavoriteToken)
  return (
    <TouchableArea hapticFeedback>
      <FavoriteButton
        isFavorited={isFavoriteToken}
        size={iconSizes.icon24}
        onPress={onFavoritePress}
      />
    </TouchableArea>
  )
}
