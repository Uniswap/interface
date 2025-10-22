import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { UwULinkAllowlist } from 'uniswap/src/features/gating/configs'

export const isUwULinkAllowlistType = (x: unknown): x is UwULinkAllowlist => {
  const hasFields =
    x !== null && typeof x === 'object' && Object.hasOwn(x, 'contracts') && Object.hasOwn(x, 'tokenRecipients')

  if (!hasFields) {
    return false
  }

  const castedObj = x as { contracts: unknown; tokenRecipients: unknown }

  return Array.isArray(castedObj.contracts) && Array.isArray(castedObj.tokenRecipients)
}

export const isUniverseChainIdArrayType = (x: unknown): x is UniverseChainId[] =>
  Array.isArray(x) && x.every((c: unknown) => typeof c === 'number')

export const isContractInputArrayType = (x: unknown): x is GraphQLApi.ContractInput[] =>
  Array.isArray(x) &&
  x.every((val) => typeof val.chain === 'string' && (!val.address || typeof val.address === 'string'))
