import type { UniverseChainId } from 'uniswap/src/features/chains/types'

export enum WalletStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Unavailable = 'Unavailable',
  ActionRequired = 'ActionRequired',
}

export interface ActiveDelegation {
  chainId: UniverseChainId
  delegationAddress: string
  timestamp?: number
}

export interface WalletData {
  name: string
  walletAddress: string
  activeDelegationNetworkToAddress: Partial<Record<UniverseChainId, { delegationAddress: string }>>
  status: WalletStatus
}

export enum SmartWalletModalState {
  None = 'none',
  Disable = 'disable',
  DisableWarning = 'disableWarning',
  EnabledSuccess = 'enabledSuccess',
  Unavailable = 'unavailable',
  ActionRequired = 'actionRequired',
  Confirm = 'confirm',
  InsufficientFunds = 'insufficientFunds',
}
