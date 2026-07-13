import { type RWAAsset, type RWAToken, type RWAWhitelist } from 'uniswap/src/features/rwa/types'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

export type RWACandidate = {
  chainId: number | null | undefined
  address: string | null | undefined
}

export type RWAMatch = {
  asset: RWAAsset
  token: RWAToken
}

type RWACandidateInput = RWACandidate | null | undefined

export function rwaTokenMatchesCandidate(token: RWACandidate, candidate: RWACandidateInput): boolean {
  if (
    !candidate ||
    token.chainId === null ||
    token.chainId === undefined ||
    !token.address ||
    candidate.chainId === null ||
    candidate.chainId === undefined ||
    !candidate.address ||
    token.chainId !== candidate.chainId
  ) {
    return false
  }

  return areAddressesEqual({
    addressInput1: { address: token.address, chainId: token.chainId },
    addressInput2: { address: candidate.address, chainId: candidate.chainId },
  })
}

function findMatchForCandidate({
  rwaWhitelist,
  candidate,
}: {
  rwaWhitelist: RWAWhitelist
  candidate: RWACandidateInput
}): RWAMatch | undefined {
  if (!candidate) {
    return undefined
  }

  for (const asset of rwaWhitelist) {
    const token = asset.tokens.find((rwaToken) => rwaTokenMatchesCandidate(rwaToken, candidate))
    if (token) {
      return { asset, token }
    }
  }

  return undefined
}

export function findRWAMatch({
  rwaWhitelist,
  candidates,
}: {
  rwaWhitelist: RWAWhitelist
  candidates: readonly RWACandidateInput[] | null | undefined
}): RWAMatch | undefined {
  // Candidates are ordered by the caller from most specific to least specific.
  // TDP passes the URL token first, then any sibling contracts from the token project.
  for (const candidate of candidates ?? []) {
    const match = findMatchForCandidate({
      rwaWhitelist,
      candidate,
    })
    if (match) {
      return match
    }
  }

  return undefined
}
