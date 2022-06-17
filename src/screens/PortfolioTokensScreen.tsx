import React from 'react'
import { HomeStackScreenProp } from 'src/app/navigation/types'
import { AppBackground } from 'src/components/gradients'
import { PortfolioTokensSection } from 'src/components/home/PortfolioTokensSection'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from 'src/screens/Screens'

export function PortfolioTokensScreen({
  route: {
    params: { owner },
  },
}: HomeStackScreenProp<Screens.PortfolioTokens>) {
  // TODO: implement new home screen UI with ListDetailScreen
  return (
    <Screen withSharedElementTransition>
      <AppBackground />
      <PortfolioTokensSection count={15} owner={owner} />
    </Screen>
  )
}
