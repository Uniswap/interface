import { UniverseChainId } from '@universe/chains'

export const isUniverseChainIdArrayType = (x: unknown): x is UniverseChainId[] =>
  Array.isArray(x) && x.every((c: unknown) => typeof c === 'number')
