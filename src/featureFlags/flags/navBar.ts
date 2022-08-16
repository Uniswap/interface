import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useNavBarFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.navBar)
}

export { BaseVariant as NavBarVariant }
