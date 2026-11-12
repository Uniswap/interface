export function normalizeHookSearch(search = ''): string {
  return search.trim().toLowerCase()
}

export function getHookSearchAddress(search = ''): string | undefined {
  const normalizedSearch = normalizeHookSearch(search)
  return /^0x[0-9a-f]{40}$/.test(normalizedSearch) ? normalizedSearch : undefined
}
