import { ExternalWallet } from 'features/accounts/store/types'

export interface ConnectionService {
  connect: (params: { wallet: ExternalWallet }) => Promise<{ connected: boolean }>
}
