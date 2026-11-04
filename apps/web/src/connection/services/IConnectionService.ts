import { ExternalWallet } from '~/connection/accounts/types'

export interface ConnectionService {
  connect: (params: { wallet: ExternalWallet }) => Promise<{ connected: boolean }>
}
