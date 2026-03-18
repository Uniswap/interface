// New helper for adapting ethers or viem receipts to the shared TransactionReceipt type
import { providers } from 'ethers/lib/ethers'
import { TransactionReceipt as SharedTransactionReceipt } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionReceipt as ViemTransactionReceipt } from 'viem'
import { ZksyncTransactionReceipt } from 'viem/chains'

type ViemTransactionReceiptOrZksyncReceipt = ViemTransactionReceipt | ZksyncTransactionReceipt

// Helper to normalize bigint / BigNumber / number to a JS number
const toNumber = (value: unknown): number => {
  if (value == null) {
    return 0
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'number') {
    return value
  }
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (typeof value === 'object' && value !== null && 'toNumber' in (value as Record<string, unknown>)) {
    try {
      return (value as { toNumber: () => number }).toNumber()
    } catch {
      /* fall through */
    }
  }
  return Number(value)
}

/**
 * Adapt an ethers.js TransactionReceipt to the shared receipt shape.
 */
export function receiptFromEthersReceipt(
  ethersReceipt: providers.TransactionReceipt | undefined,
  confirmedTime?: number,
): SharedTransactionReceipt | undefined {
  if (!ethersReceipt) {
    return undefined
  }

  return {
    blockHash: ethersReceipt.blockHash,
    blockNumber: toNumber(ethersReceipt.blockNumber),
    transactionIndex: toNumber(ethersReceipt.transactionIndex),
    confirmedTime: confirmedTime ?? Date.now(),
    gasUsed: toNumber(ethersReceipt.gasUsed),
    effectiveGasPrice: toNumber(ethersReceipt.effectiveGasPrice),
  }
}

/**
 * Adapt a viem‐style TransactionReceipt (returned by wagmi/publicClient) to the
 * shared receipt shape.
 * The viem receipt already uses plain numbers & bigint, so we just normalize.
 */
export function receiptFromViemReceipt(
  viemReceipt: ViemTransactionReceiptOrZksyncReceipt | undefined,
  confirmedTime?: number,
): SharedTransactionReceipt | undefined {
  if (!viemReceipt) {
    return undefined
  }

  return {
    blockHash: viemReceipt.blockHash,
    blockNumber: toNumber(viemReceipt.blockNumber),
    transactionIndex: toNumber(viemReceipt.transactionIndex),
    confirmedTime: confirmedTime ?? Date.now(),
    gasUsed: toNumber(viemReceipt.gasUsed),
    effectiveGasPrice: toNumber(viemReceipt.effectiveGasPrice),
  }
}
