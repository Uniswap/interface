import { ExploreStackParamList } from 'src/app/navigation/types'
import { Screens } from 'src/screens/Screens'

type InnerExploreStackParamList = Omit<ExploreStackParamList, Screens.Explore>

// The ExploreModalState allows a Screen and its Params to be defined, except for the initial Explore screen.
// This workaround facilitates navigation to any screen within the ExploreStack from outside.
// Implementation of this lives inside screens/ExploreScreen

export type ExploreModalState = {
  [V in keyof InnerExploreStackParamList]: { screen: V; params: InnerExploreStackParamList[V] }
}[keyof InnerExploreStackParamList]
