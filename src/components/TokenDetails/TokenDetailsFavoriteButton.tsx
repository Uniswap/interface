import React from 'react'
import { useAppSelector } from 'src/app/hooks'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { DynamicHeartIcon } from 'src/features/externalProfile/ProfileHeader'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { iconSizes } from 'src/styles/sizing'

export function TokenDetailsFavoriteButton({ currencyId }: { currencyId: string }): JSX.Element {
  const id = currencyId.toLowerCase()
  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(id)
  const onFavoritePress = useToggleFavoriteCallback(id)

  return (
    <TouchableArea hapticFeedback onPress={onFavoritePress}>
      <DynamicHeartIcon isFavorited={isFavoriteToken} size={iconSizes.icon24} />
    </TouchableArea>
  )
}
