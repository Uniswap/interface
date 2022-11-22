import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useAppSelector, useAppTheme } from 'src/app/hooks'
import StarIcon from 'src/assets/icons/star.svg'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { useToggleFavoriteCallback } from 'src/features/favorites/hooks'
import { selectFavoriteTokensSet } from 'src/features/favorites/selectors'
import { currencyId } from 'src/utils/currencyId'

type TokenDetailsFavoriteButtonProps = {
  currency: Currency
}

export function TokenDetailsFavoriteButton({ currency }: TokenDetailsFavoriteButtonProps) {
  const theme = useAppTheme()

  const id = currencyId(currency).toLowerCase()
  const isFavoriteToken = useAppSelector(selectFavoriteTokensSet).has(id)
  const onFavoritePress = useToggleFavoriteCallback(id)

  return (
    <TouchableArea hapticFeedback px="xxxs" py="sm" onPress={onFavoritePress}>
      <StarIcon
        color={isFavoriteToken ? theme.colors.accentWarning : theme.colors.textSecondary}
        fill={isFavoriteToken ? theme.colors.accentWarning : theme.colors.none}
        height={theme.iconSizes.lg}
        strokeWidth="1.5"
        width={theme.iconSizes.lg}
      />
    </TouchableArea>
  )
}
