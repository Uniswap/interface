import { TransactionStatus, FINAL_STATUSES, TransactionDetails, InterfaceTransactionDetails, BridgeTransactionInfo, ConfirmedSwapTransactionInfo, FinalizedTransactionDetails, FinalizedTransactionStatus, TransactionType, TransactionTypeInfo } from 'uniswap/src/features/transactions/types/transactionDetails'

export function isConfirmedSwapTypeInfo(typeInfo: TransactionTypeInfo): typeInfo is ConfirmedSwapTransactionInfo {
  return Boolean(
    (typeInfo as ConfirmedSwapTransactionInfo).inputCurrencyAmountRaw &&
      (typeInfo as ConfirmedSwapTransactionInfo).outputCurrencyAmountRaw,
  )
}

export function isBridgeTypeInfo(typeInfo: TransactionTypeInfo): typeInfo is BridgeTransactionInfo {
  return typeInfo.type === TransactionType.Bridge
}

export function isFinalizedTxStatus(status: TransactionStatus): status is FinalizedTransactionStatus {
  return FINAL_STATUSES.some((finalStatus) => finalStatus === status)
}

export function isFinalizedTx(tx: TransactionDetails | FinalizedTransactionDetails): tx is FinalizedTransactionDetails {
  const validateFinalizedTx = (): FinalizedTransactionDetails | undefined => {
    const { status, hash } = tx
    if (status === TransactionStatus.Success) {
      if (!hash) {
        return undefined
      }
      return { ...tx, status, hash }
    } else if (isFinalizedTxStatus(status)) {
      return { ...tx, status }
    }
    return undefined
  }

  // Validation fn prevents & future-proofs the typeguard from illicit casting
  return Boolean(validateFinalizedTx())
}

// Type guard that combines multiple checks for interface-specific fields
export function isWalletTransaction(
  transaction: TransactionDetails | InterfaceTransactionDetails,
): transaction is TransactionDetails {
  // Wallet transactions have these optional fields that interface transactions don't have.  We can't rely on this alone because it's possible none of these fields are present.
  const hasWalletOptionalFields =
    'ownerAddress' in transaction ||
    'receipt' in transaction ||
    'cancelRequest' in transaction ||
    'networkFee' in transaction

  // Interface transactions have a required 'hash' field
  // Wallet transactions have an optional 'hash' field
  const hasRequiredInterfaceHash = 'hash' in transaction && typeof transaction.hash === 'string'

  if (hasWalletOptionalFields || !hasRequiredInterfaceHash) {
    return true
  }

  // Interface transactions have these optional fields that wallet transactions don't have:
  const hasInterfaceOptionalFields =
    'nonce' in transaction ||
    'batchInfo' in transaction ||
    'lastCheckedBlockNumber' in transaction ||
    'deadline' in transaction ||
    'cancelled' in transaction ||
    'confirmedTime' in transaction

  // If it has the required interface hash OR any interface-specific optional fields, it's an interface transaction
  return !hasInterfaceOptionalFields
}

// Function that returns the transaction typed as TransactionDetails when it's a wallet transaction
export function getWalletTransaction(
  transaction: TransactionDetails | InterfaceTransactionDetails,
): TransactionDetails | undefined {
  return isWalletTransaction(transaction) ? transaction : undefined
}

// Type guard that checks for interface-specific fields and ensures no wallet-specific fields are present
export function isInterfaceTransaction(
  transaction: TransactionDetails | InterfaceTransactionDetails,
): transaction is InterfaceTransactionDetails {

  // Interface transactions have these optional fields that wallet transactions don't have.  We can't rely on this alone because it's possible none of these fields are present.
  const hasInterfaceOptionalFields =
    'nonce' in transaction ||
    'batchInfo' in transaction ||
    'lastCheckedBlockNumber' in transaction ||
    'deadline' in transaction ||
    'cancelled' in transaction ||
    'confirmedTime' in transaction

  if (hasInterfaceOptionalFields) {
    return true
  }
  // Interface transactions have a required 'hash' field
  const hasRequiredInterfaceHash = 'hash' in transaction && typeof transaction.hash === 'string'

  // Wallet transactions have these optional fields that interface transactions don't have:
  // - ownerAddress
  // - receipt
  // - cancelRequest
  // - networkFee
  const hasWalletOptionalFields =
    'ownerAddress' in transaction ||
    'receipt' in transaction ||
    'cancelRequest' in transaction ||
    'networkFee' in transaction

  // It's an interface transaction if it has the required interface hash AND no wallet-specific fields
  return hasRequiredInterfaceHash && !hasWalletOptionalFields
}

// Function that returns the transaction typed as InterfaceTransactionDetails when it's an interface transaction
export function getInterfaceTransaction(
  transaction: TransactionDetails | InterfaceTransactionDetails,
): InterfaceTransactionDetails | undefined {
  return isInterfaceTransaction(transaction) ? transaction : undefined
}
