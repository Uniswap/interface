import { BaseVariant, FeatureFlag, useBaseFlag } from '../index'

export function useGqlTokenListsEnabledFlag(): BaseVariant {
  return useBaseFlag(FeatureFlag.gqlTokenLists)
}

// eslint-disable-next-line import/no-unused-modules
export function useGqlTokenListsEnabled(): boolean {
  return useGqlTokenListsEnabledFlag() === BaseVariant.Enabled
}
