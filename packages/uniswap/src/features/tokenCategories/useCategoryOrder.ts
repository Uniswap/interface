import { CategoriesOrderConfigKey, DynamicConfigs, useDynamicConfigValue } from '@universe/gating'
import { useMemo } from 'react'
import { orderCategories } from 'uniswap/src/features/tokenCategories/orderCategories'

export type CategoriesOrderConfig = DynamicConfigs.TokenCategoriesOrder | DynamicConfigs.PoolCategoriesOrder

const EMPTY_ORDER: string[] = []

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'string')
}

export function useCategoryOrder<T extends { id: string }>({
  categories,
  config,
}: {
  categories: T[]
  config: CategoriesOrderConfig
}): T[] {
  const orderedCategoryIds = useDynamicConfigValue({
    config,
    key: CategoriesOrderConfigKey.OrderedCategoryIds,
    defaultValue: EMPTY_ORDER,
    customTypeGuard: isStringArray,
  })

  return useMemo(() => orderCategories({ categories, orderedCategoryIds }), [categories, orderedCategoryIds])
}
