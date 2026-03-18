import { createNavigationContainerRef } from '@react-navigation/native'
import { ExploreStackParamList, FiatOnRampStackParamList, RootParamList } from 'src/app/navigation/types'

// this was moved to its own file to avoid circular dependencies
export const navigationRef = createNavigationContainerRef<RootParamList>()
export const exploreNavigationRef = createNavigationContainerRef<ExploreStackParamList>()
export const fiatOnRampNavigationRef = createNavigationContainerRef<FiatOnRampStackParamList>()
export const navRefs = [exploreNavigationRef, fiatOnRampNavigationRef, navigationRef]
