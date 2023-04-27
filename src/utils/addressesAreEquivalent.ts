export function addressesAreEquivalent(a: string | null | undefined, b: string | null | undefined) {
  if (!a || !b) return false
  return a === b || a.toLowerCase() === b.toLowerCase()
}
