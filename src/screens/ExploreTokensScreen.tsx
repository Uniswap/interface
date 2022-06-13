import React from 'react'
import { ExploreStackScreenProp } from 'src/app/navigation/types'
import { AppBackground } from 'src/components/gradients'
import { Box } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { FavoriteTokensSection } from 'src/features/explore/FavoriteTokensSection'
import { useTokenMetadataDisplayType } from 'src/features/explore/hooks'
import { TopTokensSection } from 'src/features/explore/TopTokensSection'
import { Screens } from 'src/screens/Screens'

export function ExploreTokensScreen({
  route: {
    params: { displayFavorites },
  },
}: ExploreStackScreenProp<Screens.ExploreTokens>) {
  const [tokenMetadataDisplayType, cycleTokenMetadataDisplayType] = useTokenMetadataDisplayType()

  return (
    <Screen withSharedElementTransition>
      <AppBackground />
      <Box flex={1} m="sm">
        {displayFavorites ? (
          <FavoriteTokensSection
            expanded
            metadataDisplayType={tokenMetadataDisplayType}
            onCycleMetadata={cycleTokenMetadataDisplayType}
          />
        ) : (
          <TopTokensSection
            expanded
            metadataDisplayType={tokenMetadataDisplayType}
            onCycleMetadata={cycleTokenMetadataDisplayType}
          />
        )}
      </Box>
    </Screen>
  )
}
