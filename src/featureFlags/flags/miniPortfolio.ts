import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useMiniPortfolioFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.miniPortfolio, BaseVariant.Enabled)
}

export function useMiniPortfolioEnabled(): boolean {
  return useMiniPortfolioFlag() === BaseVariant.Enabled
}
