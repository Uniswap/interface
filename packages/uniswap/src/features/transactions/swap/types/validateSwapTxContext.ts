import { isWebApp } from '@universe/environment'
import { ValidatedGasFeeResult, validateGasFeeResult } from 'uniswap/src/features/gas/utils'
import { PermitMethod } from 'uniswap/src/features/transactions/swap/types/permitMethod'
import type {
  BridgeSwapTxAndGasInfo,
  ChainedSwapTxAndGasInfo,
  ClassicSwapTxAndGasInfo,
  SolanaSwapTxAndGasInfo,
  SwapTxAndGasInfo,
  UniswapXSwapTxAndGasInfo,
  ValidatedBridgeSwapTxAndGasInfo,
  ValidatedChainedSwapTxAndGasInfo,
  ValidatedClassicSwapTxAndGasInfo,
  ValidatedSolanaSwapTxAndGasInfo,
  ValidatedSwapTxContext,
  ValidatedTxRequestsOrUserOp,
  ValidatedUniswapXSwapTxAndGasInfo,
  ValidatedWrapSwapTxAndGasInfo,
  WrapSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import {
  isBridge,
  isChained,
  isClassic,
  isJupiter,
  isUniswapX,
  isWrap,
} from 'uniswap/src/features/transactions/swap/utils/routing'
import { PopulatedTransactionRequestArray } from 'uniswap/src/features/transactions/types/transactionRequests'
import type { RpcUserOperation } from 'viem/account-abstraction'

function isGasSponsorshipPromisedButUndelivered(swapTxContext: SwapTxAndGasInfo): boolean {
  if (!isClassic(swapTxContext) && !isBridge(swapTxContext) && !isWrap(swapTxContext)) {
    return false
  }

  const sponsored = swapTxContext.trade?.quote.sponsorshipInfo?.sponsored
  if (!sponsored) {
    return false
  }

  const delivered = swapTxContext.requestUniswapGasSponsorship === true || Boolean(swapTxContext.paymasterService?.url)
  return !delivered
}

export function validateSwapTxContext(swapTxContext: SwapTxAndGasInfo): ValidatedSwapTxContext | undefined {
  if (!swapTxContext.trade) {
    return undefined
  }

  const gasFee = validateGasFeeResult(swapTxContext.gasFee)
  if (!gasFee) {
    return undefined
  }

  if (isGasSponsorshipPromisedButUndelivered(swapTxContext)) {
    return undefined
  }

  if (isClassic(swapTxContext)) {
    return validateClassicSwap({ swapTxContext, gasFee })
  }
  if (isBridge(swapTxContext)) {
    return validateBridgeSwap({ swapTxContext, gasFee })
  }
  if (isUniswapX(swapTxContext)) {
    return validateUniswapXSwap({ swapTxContext, gasFee })
  }
  if (isWrap(swapTxContext)) {
    return validateWrapSwap({ swapTxContext, gasFee })
  }
  if (isJupiter(swapTxContext)) {
    return validateSolanaSwap({ swapTxContext, gasFee })
  }
  if (isChained(swapTxContext)) {
    return validateChainedSwap({ swapTxContext, gasFee })
  }

  return undefined
}

export function pickTxRequestsOrUserOp({
  txRequests,
  unsignedUserOperation,
  requestUniswapGasSponsorship,
}: {
  txRequests: PopulatedTransactionRequestArray | undefined
  unsignedUserOperation?: RpcUserOperation<'0.8'>
  requestUniswapGasSponsorship?: boolean
}): ValidatedTxRequestsOrUserOp | undefined {
  if (txRequests) {
    return { txRequests, unsignedUserOperation: undefined, requestUniswapGasSponsorship: undefined }
  }
  if (unsignedUserOperation) {
    // 4337 sponsored path: paymaster + signing happen in the execute saga.
    return {
      txRequests: undefined,
      unsignedUserOperation,
      requestUniswapGasSponsorship: requestUniswapGasSponsorship ?? false,
    }
  }
  return undefined
}

function validateClassicSwap({
  swapTxContext,
  gasFee,
}: {
  swapTxContext: ClassicSwapTxAndGasInfo
  gasFee: ValidatedGasFeeResult
}): ValidatedClassicSwapTxAndGasInfo | undefined {
  const { trade, hasUnsignedPermit, permit } = swapTxContext
  if (!trade) {
    return undefined
  }

  const base = { ...swapTxContext, trade, gasFee }

  // Web-only path: user must sign a typed-data permit before tx requests can be fetched.
  if (hasUnsignedPermit) {
    if (!isWebApp || permit?.method !== PermitMethod.TypedData) {
      return undefined
    }
    return {
      ...base,
      hasUnsignedPermit: true,
      permit,
      txRequests: undefined,
      unsignedUserOperation: undefined,
      requestUniswapGasSponsorship: undefined,
    }
  }

  const txOrUserOp = pickTxRequestsOrUserOp(swapTxContext)
  if (!txOrUserOp) {
    return undefined
  }

  // Standard EOA path
  if (txOrUserOp.txRequests) {
    return {
      ...base,
      hasUnsignedPermit: false,
      permit: permit?.method === PermitMethod.Transaction ? permit : undefined,
      txRequests: txOrUserOp.txRequests,
      unsignedUserOperation: undefined,
      requestUniswapGasSponsorship: undefined,
    }
  }

  return {
    ...base,
    hasUnsignedPermit: false,
    permit: undefined,
    txRequests: undefined,
    unsignedUserOperation: txOrUserOp.unsignedUserOperation,
    requestUniswapGasSponsorship: txOrUserOp.requestUniswapGasSponsorship,
  }
}

function validateBridgeSwap({
  swapTxContext,
  gasFee,
}: {
  swapTxContext: BridgeSwapTxAndGasInfo
  gasFee: ValidatedGasFeeResult
}): ValidatedBridgeSwapTxAndGasInfo | undefined {
  const txOrUserOp = pickTxRequestsOrUserOp(swapTxContext)
  if (!txOrUserOp) {
    return undefined
  }
  if (txOrUserOp.txRequests) {
    return {
      ...swapTxContext,
      gasFee,
      txRequests: txOrUserOp.txRequests,
      unsignedUserOperation: undefined,
      requestUniswapGasSponsorship: undefined,
    }
  }
  return {
    ...swapTxContext,
    gasFee,
    txRequests: undefined,
    unsignedUserOperation: txOrUserOp.unsignedUserOperation,
    requestUniswapGasSponsorship: txOrUserOp.requestUniswapGasSponsorship,
  }
}

function validateWrapSwap({
  swapTxContext,
  gasFee,
}: {
  swapTxContext: WrapSwapTxAndGasInfo
  gasFee: ValidatedGasFeeResult
}): ValidatedWrapSwapTxAndGasInfo | undefined {
  const txOrUserOp = pickTxRequestsOrUserOp(swapTxContext)
  if (!txOrUserOp) {
    return undefined
  }
  if (txOrUserOp.txRequests) {
    return {
      ...swapTxContext,
      gasFee,
      includesDelegation: false,
      txRequests: txOrUserOp.txRequests,
      unsignedUserOperation: undefined,
      requestUniswapGasSponsorship: undefined,
    }
  }
  return {
    ...swapTxContext,
    gasFee,
    includesDelegation: false,
    txRequests: undefined,
    unsignedUserOperation: txOrUserOp.unsignedUserOperation,
    requestUniswapGasSponsorship: txOrUserOp.requestUniswapGasSponsorship,
  }
}

function validateUniswapXSwap({
  swapTxContext,
  gasFee,
}: {
  swapTxContext: UniswapXSwapTxAndGasInfo
  gasFee: ValidatedGasFeeResult
}): ValidatedUniswapXSwapTxAndGasInfo | undefined {
  // UniswapX orders are off-chain and always require a typed-data permit.
  const { permit } = swapTxContext
  if (!permit) {
    return undefined
  }
  return { ...swapTxContext, gasFee, permit, includesDelegation: false }
}

function validateSolanaSwap({
  swapTxContext,
  gasFee,
}: {
  swapTxContext: SolanaSwapTxAndGasInfo
  gasFee: ValidatedGasFeeResult
}): ValidatedSolanaSwapTxAndGasInfo | undefined {
  const { transactionBase64 } = swapTxContext
  if (!transactionBase64) {
    return undefined
  }
  return { ...swapTxContext, transactionBase64, gasFee }
}

function validateChainedSwap({
  swapTxContext,
  gasFee,
}: {
  swapTxContext: ChainedSwapTxAndGasInfo
  gasFee: ValidatedGasFeeResult
}): ValidatedChainedSwapTxAndGasInfo | undefined {
  return { ...swapTxContext, gasFee, includesDelegation: swapTxContext.includesDelegation ?? false }
}
