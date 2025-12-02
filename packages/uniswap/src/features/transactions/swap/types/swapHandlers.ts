import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { PresetPercentage } from 'uniswap/src/components/CurrencyInputPanel/AmountInputPresets/types'
import { SwapExecutionCallbacks } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { ValidatedSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { SignerMnemonicAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

/**
 * Parameters needed for transaction preparation
 */
export interface PrepareSwapParams {
  swapTxContext: ValidatedSwapTxContext
}

/**
 * Function type for preparing and signing a swap transaction.
 */
export type PrepareSwapCallback = (params: PrepareSwapParams) => Promise<void>

/**
 * Parameters for executing a (potentially) pre-signed swap transaction
 */
export interface ExecuteSwapParams extends SwapExecutionCallbacks {
  account: SignerMnemonicAccountDetails
  swapTxContext: ValidatedSwapTxContext
  currencyInAmountUSD?: CurrencyAmount<Currency>
  currencyOutAmountUSD?: CurrencyAmount<Currency>
  isAutoSlippage: boolean
  presetPercentage?: PresetPercentage
  preselectAsset?: boolean
  txId?: string
  isFiatInputMode?: boolean
  // Wrap-specific parameters
  wrapType?: WrapType
  inputCurrencyAmount?: CurrencyAmount<Currency>
}

/**
 * Function type for executing a (potentially) pre-signed swap transaction
 */
export type ExecuteSwapCallback = (params: ExecuteSwapParams) => Promise<void>

/**
 * Unified interface for handling both transaction preparation and execution
 */
export interface SwapHandlers {
  /** Prepares and signs the swap transaction(s) */
  prepareAndSign: PrepareSwapCallback
  /** Executes a (potentially) pre-signed swap transaction */
  execute: ExecuteSwapCallback
}
