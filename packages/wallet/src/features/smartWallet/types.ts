export enum WalletStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Unavailable = 'Unavailable',
}

export interface WalletData {
  name: string
  walletAddress: string
  delegatorAddress: string
  status: WalletStatus
}
