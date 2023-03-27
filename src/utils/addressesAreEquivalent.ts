export function addressesAreEquivalent(a?: string, b?: string) {
  if (!a || !b) return false
  return a === b || a.toLowerCase() === b.toLowerCase()
}
