import React from 'react'
import { useAppSelector } from 'src/app/hooks'
import { Favorite } from 'src/components/icons/Favorite'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { selectFavoriteTokens } from 'wallet/src/features/favorites/selectors'

export function TokenDetailsFavoriteButton({ currencyId }: { currencyId: string }): JSX.Element {
  const id = currencyId.toLowerCase()
  const isFavoriteToken = useAppSelector(selectFavoriteTokens).indexOf(id) !== -1
  const onFavoritePress = useToggleFavoriteCallback(id, isFavoriteToken)
  return (
    <TouchableArea
      hapticFeedback
      hitSlop={{ right: 20, left: 5, top: 20, bottom: 20 }}
      onPress={onFavoritePress}>
      <Favorite isFavorited={isFavoriteToken} size={iconSizes.icon24} />
    </TouchableArea>
  )
}
