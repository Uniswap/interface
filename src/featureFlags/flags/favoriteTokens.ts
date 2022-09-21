import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useFavoriteTokensFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.favoriteTokens)
}

export { BaseVariant as FavoriteTokensVariant }
