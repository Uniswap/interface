import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'

export interface PrepareAndSignDappTransactionParams {
  /** The dapp request with gas estimates already applied */
  request: ValidatedTransactionRequest

  /** The account to use for signing */
  account: SignerMnemonicAccountMeta

  /** The chain ID for the transaction */
  chainId: UniverseChainId

  /** Callback for successful preparation */
  onSuccess?: (result: SignedTransactionRequest) => void

  /** Callback for failed preparation */
  onFailure?: (error: Error) => void
}
