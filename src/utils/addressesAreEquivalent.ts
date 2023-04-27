import { Maybe } from 'graphql/jsutils/Maybe'

export function addressesAreEquivalent(a: Maybe<string>, b: Maybe<string>) {
  if (!a || !b) return false
  return a === b || a.toLowerCase() === b.toLowerCase()
}
