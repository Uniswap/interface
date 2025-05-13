import React from 'react'
import { useSelector } from 'react-redux'
import { Favorite } from 'src/components/icons/Favorite'
import { TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { selectFavoriteTokens } from 'uniswap/src/features/favorites/selectors'
import { useToggleFavoriteCallback } from 'uniswap/src/features/favorites/useToggleFavoriteCallback'

export function TokenDetailsFavoriteButton({ currencyId }: { currencyId: string }): JSX.Element {
  const id = currencyId.toLowerCase()
  const isFavoriteToken = useSelector(selectFavoriteTokens).indexOf(id) !== -1
  const onFavoritePress = useToggleFavoriteCallback(id, isFavoriteToken)
  return (
    <TouchableArea hitSlop={{ right: 20, left: 5, top: 20, bottom: 20 }} onPress={onFavoritePress}>
      <Favorite isFavorited={isFavoriteToken} size={iconSizes.icon24} />
    </TouchableArea>
  )
}
