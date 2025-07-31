export interface DelegationRepository {
  getWalletDelegations: (input: { address: string; chainIds: number[] }) => Promise<ChainDelegationDetails>
}

export type DelegatedResult =
  | {
      isDelegated: true
      delegatedAddress: string
    }
  | {
      isDelegated: false
      delegatedAddress: null
    }

export type ChainDelegatedResults = Record<string, DelegatedResult>
export type DelegationDetails = {
  currentDelegationAddress: string | null
  isWalletDelegatedToUniswap: boolean
  latestDelegationAddress: string
} | null
export type ChainDelegationDetails = Record<string, DelegationDetails>
