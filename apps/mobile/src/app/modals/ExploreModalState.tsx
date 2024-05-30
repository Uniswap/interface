import { ExploreStackParamList } from 'src/app/navigation/types'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'

type InnerExploreStackParamList = Omit<ExploreStackParamList, MobileScreens.Explore>

// The ExploreModalState allows a Screen and its Params to be defined, except for the initial Explore screen.
// This workaround facilitates navigation to any screen within the ExploreStack from outside.
// Implementation of this lives inside screens/ExploreScreen

export type ExploreModalState = {
  [V in keyof InnerExploreStackParamList]: { screen: V; params: InnerExploreStackParamList[V] }
}[keyof InnerExploreStackParamList]
