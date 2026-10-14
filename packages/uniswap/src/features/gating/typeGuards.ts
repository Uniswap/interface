import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { RWAIssuerLogosMap } from '@universe/gating'

export const isRWAIssuerLogosMap = (x: unknown): x is RWAIssuerLogosMap => {
  if (x === null || typeof x !== 'object') {
    return false
  }
  return Object.values(x).every((logo) => {
    if (logo === null || typeof logo !== 'object') {
      return false
    }
    const { light, dark } = logo as { light?: unknown; dark?: unknown }
    return (light === undefined || typeof light === 'string') && (dark === undefined || typeof dark === 'string')
  })
}

export const isUniverseChainIdArrayType = (x: unknown): x is UniverseChainId[] =>
  Array.isArray(x) && x.every((c: unknown) => typeof c === 'number')

export const isContractInputArrayType = (x: unknown): x is GraphQLApi.ContractInput[] =>
  Array.isArray(x) &&
  x.every((val) => typeof val.chain === 'string' && (!val.address || typeof val.address === 'string'))
