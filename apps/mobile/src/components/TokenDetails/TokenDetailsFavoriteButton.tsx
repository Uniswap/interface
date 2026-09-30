import { iconSizes, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import React from 'react'
import { Favorite } from 'src/components/icons/Favorite'
import { useSelectHasTokenFavorited } from 'uniswap/src/features/favorites/hooks/useSelectHasTokenFavorited'
import { useToggleFavoriteCallback } from 'uniswap/src/features/favorites/hooks/useToggleFavoriteCallback'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

export function TokenDetailsFavoriteButton({
  currencyId,
  tokenName,
}: {
  currencyId: string
  tokenName?: string
}): JSX.Element {
  const id = normalizeCurrencyIdForMapLookup(currencyId)
  const isFavoriteToken = useSelectHasTokenFavorited(id)
  const onFavoritePress = useToggleFavoriteCallback({ id, tokenName, isFavoriteToken })
  return (
    <TouchableArea
      hitSlop={{ right: 20, left: 5, top: 20, bottom: 20 }}
      testID={TestID.TokenDetailsFavoriteButton}
      onPress={onFavoritePress}
    >
      <Favorite isFavorited={isFavoriteToken} size={iconSizes.icon24} />
    </TouchableArea>
  )
}
