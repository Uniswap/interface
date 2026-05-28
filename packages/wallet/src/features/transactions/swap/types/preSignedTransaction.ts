import { SignerMnemonicAccountMeta } from 'uniswap/src/features/accounts/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  ValidatedSwapTxContext,
  ValidatedUniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ValidatedPermit } from 'uniswap/src/features/transactions/swap/utils/trade'
import { SignedTransactionRequest } from 'wallet/src/features/transactions/executeTransaction/types'

export interface SignedPermit {
  permit: ValidatedPermit
  signedData: string
}

export function isSignedPermit(
  signedTx: SignedTransactionRequest | SignedPermit | ValidatedPermit,
): signedTx is SignedPermit {
  return 'permit' in signedTx && 'signedData' in signedTx
}

interface BasePreSignedSwapTransaction {
  signedApproveTx?: SignedTransactionRequest
  signedPermitTx?: SignedTransactionRequest

  /** Metadata about the transaction preparation and signing */
  metadata: {
    /** Timestamp before the transaction was signed */
    timestampBeforeSign: number

    /** Timestamp after the transaction was signed */
    timestampAfterSign: number

    /** Whether this transaction should be submitted via private RPC */
    submitViaPrivateRpc: boolean
  }

  /** The chain ID where this transaction will be executed */
  chainId: UniverseChainId

  /** The account that signed this transaction */
  account: SignerMnemonicAccountMeta
}

export interface UniswapXPreSignedSwapTransaction extends BasePreSignedSwapTransaction {
  /** The signed permit transaction */
  signedSwapPermit: SignedPermit

  /** The swap transaction context */
  swapTxContext: ValidatedUniswapXSwapTxAndGasInfo
}

export interface OnChainPreSignedSwapTransaction extends BasePreSignedSwapTransaction {
  /** The signed transaction request */
  signedSwapTx: SignedTransactionRequest

  /** The swap transaction context */
  swapTxContext: Exclude<ValidatedSwapTxContext, ValidatedUniswapXSwapTxAndGasInfo>
}

/**
 * Represents a transaction that has been prepared and pre-signed for immediate submission
 */
export type PreSignedSwapTransaction = UniswapXPreSignedSwapTransaction | OnChainPreSignedSwapTransaction

export function isUniswapXPreSignedSwapTransaction(
  preSignedSwapTransaction: PreSignedSwapTransaction,
): preSignedSwapTransaction is UniswapXPreSignedSwapTransaction {
  return 'signedSwapPermit' in preSignedSwapTransaction
}

export function isOnChainPreSignedSwapTransaction(
  preSignedSwapTransaction: PreSignedSwapTransaction,
): preSignedSwapTransaction is OnChainPreSignedSwapTransaction {
  return 'signedSwapTx' in preSignedSwapTransaction
}
