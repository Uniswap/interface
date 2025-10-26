import { BigNumber } from '@ethersproject/bignumber'
import { FeeType } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import { TRANSACTION_CANCELLATION_GAS_FACTOR } from 'uniswap/src/constants/transactions'
import { FeeDetails, getAdjustedGasFeeDetails } from 'uniswap/src/features/gas/adjustGasFee'
import { CancellationGasFeeDetails } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'

export const CANCELLATION_TX_VALUE = '0x0'

export enum CancellationType {
  Classic = 'classic',
  UniswapX = 'uniswapx',
}

/**
 * Determines the type of cancellation needed for a transaction
 */
export function getCancellationType(
  transaction: TransactionDetails,
  orders?: UniswapXOrderDetails[],
): CancellationType {
  return isUniswapX(transaction) || (orders !== undefined && orders.length > 0)
    ? CancellationType.UniswapX
    : CancellationType.Classic
}

/**
 * Creates a classic cancellation transaction request
 */
export function createClassicCancelRequest(transaction: TransactionDetails): providers.TransactionRequest {
  return {
    chainId: transaction.chainId,
    from: transaction.from,
    to: transaction.from,
    value: CANCELLATION_TX_VALUE,
  }
}

/**
 * Calculates the cancellation gas fee based on cancellation type
 */
export function calculateCancellationGasFee(params: {
  type: CancellationType
  transaction: TransactionDetails
  gasFee?: GasFeeResult
  cancelRequest?: providers.TransactionRequest
  orders?: UniswapXOrderDetails[]
}): CancellationGasFeeDetails | undefined {
  const { type, transaction, gasFee, cancelRequest } = params

  if (type === CancellationType.UniswapX) {
    return calculateUniswapXCancellationGas(cancelRequest, gasFee)
  }

  return calculateClassicCancellationGas(transaction, gasFee)
}

/**
 * Helper function to apply cancellation gas adjustment factor to a BigNumber value
 */
function applyGasAdjustmentFactor(value: BigNumber): string {
  return value
    .mul(Math.floor(TRANSACTION_CANCELLATION_GAS_FACTOR * 100))
    .div(100)
    .toString()
}

/**
 * Pure function to calculate classic transaction cancellation gas fee
 * @param transaction - The transaction to cancel
 * @param gasFee - Current network gas fee
 * @returns Cancellation gas fee details or undefined
 */
export function calculateClassicCancellationGas(
  transaction: TransactionDetails,
  gasFee: GasFeeResult | undefined,
): CancellationGasFeeDetails | undefined {
  if (!gasFee?.params || !gasFee.value || !gasFee.displayValue || gasFee.value === '0') {
    return undefined
  }

  const classicCancelRequest = createClassicCancelRequest(transaction)

  let adjustedFeeDetails: FeeDetails | undefined

  // For classic transactions, we need the original request to determine fee adjustment
  const request = isClassic(transaction) ? transaction.options.request : undefined

  if (request) {
    try {
      adjustedFeeDetails = getAdjustedGasFeeDetails({
        request,
        currentGasFeeParams: gasFee.params,
        adjustmentFactor: TRANSACTION_CANCELLATION_GAS_FACTOR,
      })
    } catch (error) {
      logger.error(error, {
        tags: { file: 'cancel.ts', function: 'getAdjustedGasFeeDetails' },
        extra: { currentGasFeeParams: gasFee.params },
      })
      return undefined
    }
  } else {
    // If no original request is available, manually apply the adjustment factor
    if ('gasPrice' in gasFee.params) {
      const adjustedGasPrice = applyGasAdjustmentFactor(BigNumber.from(gasFee.params.gasPrice))
      adjustedFeeDetails = {
        type: FeeType.LEGACY,
        params: { gasPrice: adjustedGasPrice },
      }
    } else {
      const adjustedMaxFeePerGas = applyGasAdjustmentFactor(BigNumber.from(gasFee.params.maxFeePerGas))
      const adjustedMaxPriorityFeePerGas = applyGasAdjustmentFactor(BigNumber.from(gasFee.params.maxPriorityFeePerGas))
      adjustedFeeDetails = {
        type: FeeType.EIP1559,
        params: { maxFeePerGas: adjustedMaxFeePerGas, maxPriorityFeePerGas: adjustedMaxPriorityFeePerGas },
      }
    }
  }

  const cancelRequest = {
    ...classicCancelRequest,
    ...adjustedFeeDetails.params,
    gasLimit: gasFee.params.gasLimit,
  }

  const gasFeeDisplayValue = getCancellationGasFeeDisplayValue({
    adjustedFeeDetails,
    gasLimit: gasFee.params.gasLimit,
    previousValue: gasFee.value,
    previousDisplayValue: gasFee.displayValue,
  })

  return {
    cancelRequest,
    gasFeeDisplayValue,
  }
}

/**
 * Pure function to calculate UniswapX order cancellation gas fee
 * @param cancelRequest - The cancellation transaction request
 * @param gasFee - Current network gas fee
 * @returns Cancellation gas fee details or undefined
 */
export function calculateUniswapXCancellationGas(
  cancelRequest: providers.TransactionRequest | undefined,
  gasFee: GasFeeResult | undefined,
): CancellationGasFeeDetails | undefined {
  if (!cancelRequest || !gasFee?.displayValue) {
    return undefined
  }

  // For UniswapX cancellations, the gas fee is directly from the cancel request estimation
  // No adjustment factor is needed since the transaction is different from the original
  return {
    cancelRequest,
    gasFeeDisplayValue: gasFee.displayValue,
  }
}

/**
 * Helper function to calculate cancellation gas fee display value
 */
function getCancellationGasFeeDisplayValue({
  adjustedFeeDetails,
  gasLimit,
  previousValue,
  previousDisplayValue,
}: {
  adjustedFeeDetails: FeeDetails
  gasLimit: string
  previousValue: string
  previousDisplayValue: string
}): string {
  // Calculate the new cancellation gas fee in wei
  const newGasFeeWei = getCancellationGasFee(adjustedFeeDetails, gasLimit)

  // Maintain the same ratio between display and actual value
  // Both previousDisplayValue and previousValue are in wei (as BigNumber strings)
  // The ratio captures the gas strategy's inflation factor difference (e.g., display might be 87% of actual)
  return newGasFeeWei.mul(BigNumber.from(previousDisplayValue)).div(BigNumber.from(previousValue)).toString()
}

/**
 * Helper function to calculate cancellation gas fee
 */
function getCancellationGasFee(adjustedFeeDetails: FeeDetails, gasLimit: string): BigNumber {
  // doing object destructuring here loses ts checks based on FeeDetails.type >:(
  if (adjustedFeeDetails.type === FeeType.LEGACY) {
    return BigNumber.from(gasLimit).mul(adjustedFeeDetails.params.gasPrice)
  }

  return BigNumber.from(adjustedFeeDetails.params.maxFeePerGas).mul(gasLimit)
}
