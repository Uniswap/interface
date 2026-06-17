import type { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import type { TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import type { RpcUserOperation } from 'viem/account-abstraction'

export interface UserOpService {
  executeUserOp(params: {
    userOp: RpcUserOperation<'0.8'>
    chainId: UniverseChainId
    account: SignerMnemonicAccountMeta
    typeInfo?: TransactionTypeInfo
    requestUniswapGasSponsorship?: boolean
    paymasterServiceContext?: Record<string, unknown>
  }): Promise<{ userOpHash: string }>
}
