import { Wallet } from 'uniswap/src/features/wallet/types/Wallet'
import { HexString } from 'uniswap/src/utils/hex'

export interface WalletService {
  getWallet(params: { evmAddress?: HexString; svmAddress?: string }): Wallet
}
