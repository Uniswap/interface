import { default as React, useState } from 'react'
import { ExploreStackScreenProp } from 'src/app/navigation/types'
import { AppBackground } from 'src/components/gradients'
import { Box } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { FavoriteTokensSection } from 'src/features/explore/FavoriteTokensSection'
import { TopTokensSection } from 'src/features/explore/TopTokensSection'
import { Screens } from 'src/screens/Screens'

enum Display {
  Market = 'market',
  Favorites = 'favorites',
}

export function ExploreTokensScreen({}: ExploreStackScreenProp<Screens.ExploreTokens>) {
  // TODO: add favorites filter && chain filter
  const [display] = useState(Display.Market)
  // const [chainFilter, setChainFilter] = useState<ChainId | null>(null)

  return (
    <Screen withSharedElementTransition>
      <AppBackground />
      <Box flex={1} mb="md" mx="md">
        {display === Display.Market ? (
          <TopTokensSection expanded />
        ) : (
          <FavoriteTokensSection expanded />
        )}
      </Box>
    </Screen>
  )
}
