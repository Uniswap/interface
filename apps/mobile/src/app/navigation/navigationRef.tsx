import { createNavigationContainerRef } from '@react-navigation/native'
import { ExploreStackParamList, FiatOnRampStackParamList } from 'src/app/navigation/types'

// this was moved to its own file to avoid circular dependencies
export const navigationRef = createNavigationContainerRef()
export const exploreNavigationRef = createNavigationContainerRef<ExploreStackParamList>()
export const fiatOnRampNavigationRef = createNavigationContainerRef<FiatOnRampStackParamList>()
export const navRefs = [exploreNavigationRef, fiatOnRampNavigationRef, navigationRef]
