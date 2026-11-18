import type { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { areAddressesEqual, type UniverseChainId } from '@universe/chains'
import { RELATED_TOKENS_MAX_COUNT } from '@universe/data-api'
import {
  rankedTokenToCardItem,
  type RankedTokenCardItem,
} from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'

export interface RelatedTokensSubject {
  chainId: UniverseChainId
  address: string
}

/** True when any deployment of the ranked token is the TDP's own token, so it can be dropped from its related list. */
export function isSubjectToken(token: RankedMultichainToken, subject: RelatedTokensSubject): boolean {
  const address = token.multichainToken?.addresses[String(subject.chainId)]
  if (address === undefined) {
    return false
  }
  return areAddressesEqual({
    addressInput1: { address, chainId: subject.chainId },
    addressInput2: { address: subject.address, chainId: subject.chainId },
  })
}

export function toRelatedTokens({
  tokens,
  subject,
  maxCount = RELATED_TOKENS_MAX_COUNT,
}: {
  tokens: RankedMultichainToken[]
  subject: RelatedTokensSubject
  maxCount?: number
}): RankedTokenCardItem[] {
  return tokens
    .filter((token) => !isSubjectToken(token, subject))
    .flatMap((token) => rankedTokenToCardItem(token) ?? [])
    .slice(0, maxCount)
}
