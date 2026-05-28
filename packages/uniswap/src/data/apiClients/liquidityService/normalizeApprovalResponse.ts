import {
  type NFTPermitData,
  type PermitBatchData,
  type TransactionRequest,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { type LPApprovalResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import { type ApprovalTransactionRequest } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { permit2Address } from '@uniswap/permit2-sdk'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'

function areEvmAddressesEqual(a: string, b: string): boolean {
  return areAddressesEqual({
    addressInput1: { address: a, platform: Platform.EVM },
    addressInput2: { address: b, platform: Platform.EVM },
  })
}

function isPermitTransaction(tx: ApprovalTransactionRequest): boolean {
  if (!tx.transaction?.to || !tx.transaction.chainId) {
    return false
  }

  return areEvmAddressesEqual(tx.transaction.to, permit2Address(tx.transaction.chainId))
}

export interface NormalizedApprovalData {
  token0Approval?: TransactionRequest
  token1Approval?: TransactionRequest
  positionTokenApproval?: TransactionRequest
  token0Cancel?: TransactionRequest
  token1Cancel?: TransactionRequest
  token0PermitTransaction?: TransactionRequest
  token1PermitTransaction?: TransactionRequest
  v4BatchPermitData?: PermitBatchData
  v3NftPermitData?: NFTPermitData
  gasFeeToken0Approval?: string
  gasFeeToken1Approval?: string
  gasFeePositionTokenApproval?: string
  gasFeeToken0Cancel?: string
  gasFeeToken1Cancel?: string
  gasFeeToken0Permit?: string
  gasFeeToken1Permit?: string
}

export interface TokenAddresses {
  token0Address?: string
  token1Address?: string
  positionTokenAddress?: string
}

export function normalizeApprovalResponse(
  response: LPApprovalResponse,
  tokenAddresses: TokenAddresses,
): NormalizedApprovalData {
  let token0Approval: ApprovalTransactionRequest | undefined
  let token1Approval: ApprovalTransactionRequest | undefined
  let positionTokenApproval: ApprovalTransactionRequest | undefined
  let token0Cancel: ApprovalTransactionRequest | undefined
  let token1Cancel: ApprovalTransactionRequest | undefined
  const permits: ApprovalTransactionRequest[] = []

  for (const tx of response.transactions) {
    const toAddress = tx.transaction?.to
    if (!toAddress) {
      continue
    }

    if (isPermitTransaction(tx)) {
      permits.push(tx)
    } else if (tx.cancelApproval) {
      if (tokenAddresses.token0Address && areEvmAddressesEqual(toAddress, tokenAddresses.token0Address)) {
        token0Cancel = tx
      } else if (tokenAddresses.token1Address && areEvmAddressesEqual(toAddress, tokenAddresses.token1Address)) {
        token1Cancel = tx
      }
    } else {
      if (tokenAddresses.positionTokenAddress && areEvmAddressesEqual(toAddress, tokenAddresses.positionTokenAddress)) {
        positionTokenApproval = tx
      } else if (tokenAddresses.token0Address && areEvmAddressesEqual(toAddress, tokenAddresses.token0Address)) {
        token0Approval = tx
      } else if (tokenAddresses.token1Address && areEvmAddressesEqual(toAddress, tokenAddresses.token1Address)) {
        token1Approval = tx
      }
    }
  }

  return {
    token0Approval: token0Approval?.transaction,
    token1Approval: token1Approval?.transaction,
    positionTokenApproval: positionTokenApproval?.transaction,
    token0Cancel: token0Cancel?.transaction,
    token1Cancel: token1Cancel?.transaction,
    token0PermitTransaction: permits[0]?.transaction,
    token1PermitTransaction: permits[1]?.transaction,
    v4BatchPermitData: response.v4BatchPermitData,
    v3NftPermitData: response.v3NftPermitData,
    gasFeeToken0Approval: token0Approval?.gasFee,
    gasFeeToken1Approval: token1Approval?.gasFee,
    gasFeePositionTokenApproval: positionTokenApproval?.gasFee,
    gasFeeToken0Cancel: token0Cancel?.gasFee,
    gasFeeToken1Cancel: token1Cancel?.gasFee,
    gasFeeToken0Permit: permits[0]?.gasFee,
    gasFeeToken1Permit: permits[1]?.gasFee,
  }
}
