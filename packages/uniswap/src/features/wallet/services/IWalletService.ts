import { Wallet } from 'uniswap/src/features/wallet/types/Wallet'

export interface WalletService {
  getWallet(params: { evmAddress?: `0x${string}` }): Wallet
}
