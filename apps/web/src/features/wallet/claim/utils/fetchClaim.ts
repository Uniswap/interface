import { getValidAddress, normalizeTokenAddressForCache, Platform } from '@universe/chains'
import { logger } from 'utilities/src/logger/logger'

export interface UserClaimData {
  index: number
  amount: string
  proof: string[]
  flags?: {
    isSOCKS: boolean
    isLP: boolean
    isUser: boolean
  }
}

type LastAddress = string
type ClaimAddressMapping = { [firstAddress: string]: LastAddress }
let FETCH_CLAIM_MAPPING_PROMISE: Promise<ClaimAddressMapping> | null = null
function fetchClaimMapping(): Promise<ClaimAddressMapping> {
  return (
    FETCH_CLAIM_MAPPING_PROMISE ??
    (FETCH_CLAIM_MAPPING_PROMISE = fetch(
      `https://raw.githubusercontent.com/Uniswap/mrkl-drop-data-chunks/final/chunks/mapping.json`,
    )
      .then((res) => res.json())
      .catch((error) => {
        logger.warn('claim/hooks', 'fetchClaimMapping', 'Claim mapping fetch failed', error)
        FETCH_CLAIM_MAPPING_PROMISE = null
      }))
  )
}

const FETCH_CLAIM_FILE_PROMISES: { [startingAddress: string]: Promise<{ [address: string]: UserClaimData }> } = {}
function fetchClaimFile(key: string): Promise<{ [address: string]: UserClaimData }> {
  return (
    FETCH_CLAIM_FILE_PROMISES[key] ??
    (FETCH_CLAIM_FILE_PROMISES[key] = fetch(
      `https://raw.githubusercontent.com/Uniswap/mrkl-drop-data-chunks/final/chunks/${key}.json`,
    )
      .then((res) => res.json())
      .catch((error) => {
        logger.warn('claim/hooks', 'fetchClaimFile', 'Claim file fetch failed', error)
        delete FETCH_CLAIM_FILE_PROMISES[key]
      }))
  )
}

const FETCH_CLAIM_PROMISES: { [key: string]: Promise<UserClaimData> } = {}
// returns the claim for the given address, or null if not valid
export function fetchClaim(account: string): Promise<UserClaimData> {
  const formatted = getValidAddress({ address: account, platform: Platform.EVM, withEVMChecksum: true })
  if (!formatted) {
    return Promise.reject(new Error('Invalid address'))
  }

  return (
    FETCH_CLAIM_PROMISES[account] ??
    (FETCH_CLAIM_PROMISES[account] = fetchClaimMapping()
      .then((mapping) => {
        const sorted = Object.keys(mapping).sort((a, b) =>
          normalizeTokenAddressForCache(a) < normalizeTokenAddressForCache(b) ? -1 : 1,
        )

        for (const startingAddress of sorted) {
          const lastAddress = mapping[startingAddress]
          if (normalizeTokenAddressForCache(startingAddress) <= normalizeTokenAddressForCache(formatted)) {
            if (normalizeTokenAddressForCache(formatted) <= normalizeTokenAddressForCache(lastAddress)) {
              return startingAddress
            }
          } else {
            throw new Error(`Claim for ${formatted} was not found in partial search`)
          }
        }
        throw new Error(`Claim for ${formatted} was not found after searching all mappings`)
      })
      .then(fetchClaimFile)
      .then((result) => {
        // oxlint-disable-next-line typescript/no-unnecessary-condition
        if (result[formatted]) {
          return result[formatted]
        }
        throw new Error(`Claim for ${formatted} was not found in claim file!`)
      })
      .catch((error) => {
        logger.debug('claim/hooks', 'fetchClaim', 'Claim fetch failed', error)
        throw error
      }))
  )
}
