export function addressesAreEquivalent(a?: string | null, b?: string | null) {
  if (!a || !b) return false
  return a === b || a.toLowerCase() === b.toLowerCase()
}
