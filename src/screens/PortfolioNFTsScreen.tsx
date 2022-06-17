import React from 'react'
import { HomeStackScreenProp } from 'src/app/navigation/types'
import { AppBackground } from 'src/components/gradients'
import { PortfolioNFTSection } from 'src/components/home/PortfolioNFTSection'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from 'src/screens/Screens'

export function PortfolioNFTsScreen({
  route: {
    params: { owner },
  },
}: HomeStackScreenProp<Screens.PortfolioNFTs>) {
  // TODO: implement new home screen UI with ListDetailScreen
  return (
    <Screen withSharedElementTransition>
      <AppBackground />
      <PortfolioNFTSection count={50} owner={owner} />
    </Screen>
  )
}
