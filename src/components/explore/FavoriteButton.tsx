import React from 'react'
import { IconButton } from 'src/components/buttons/IconButton'
import { Heart } from 'src/components/icons/Heart'
import { Flex } from 'src/components/layout/Flex'
import { CoingeckoMarketCoin } from 'src/features/dataApi/coingecko/types'

interface FavoriteButtonProps {
  active: boolean
  coin: CoingeckoMarketCoin
  onPress: () => void
}

export function FavoriteButton({ active, onPress }: FavoriteButtonProps) {
  return (
    <Flex alignItems="flex-end" bg="backgroundAction">
      <IconButton
        icon={<Heart active={active} size={24} />}
        variant="transparent"
        onPress={onPress}
      />
    </Flex>
  )
}
