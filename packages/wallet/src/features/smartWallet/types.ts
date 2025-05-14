export enum WalletStatus {
  Active = 'Active',
  Inactive = 'Inactive',
  Unavailable = 'Unavailable',
}

export interface WalletData {
  name: string
  address: string
  status: WalletStatus
}
