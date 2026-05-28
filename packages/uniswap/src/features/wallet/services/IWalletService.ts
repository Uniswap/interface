import { HexString } from '@universe/encoding'
import { Wallet } from 'uniswap/src/features/wallet/types/Wallet'

export interface WalletService {
  getWallet(params: { evmAddress?: HexString; svmAddress?: string }): Wallet
}
