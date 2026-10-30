export function orderCategories<T extends { id: string }>({
  categories,
  orderedCategoryIds,
}: {
  categories: T[]
  orderedCategoryIds: string[]
}): T[] {
  if (orderedCategoryIds.length === 0) {
    return categories
  }
  const categoriesById = new Map(categories.map((category) => [category.id, category]))
  const pinnedIds = new Set(orderedCategoryIds)
  const pinned = orderedCategoryIds
    .map((id) => categoriesById.get(id))
    .filter((category): category is T => category !== undefined)
  const unpinned = categories.filter((category) => !pinnedIds.has(category.id))
  return [...pinned, ...unpinned]
}
