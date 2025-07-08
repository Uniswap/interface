import { parseEther } from '@ethersproject/units'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import {
  ApprovalResponse as ApiApprovalResponse,
  ApprovalRequest,
  TransactionRequest,
} from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { encodeFunctionData } from 'viem'
import { ERC20_ABI } from '../abi'
import { client } from '../client'

export type ApprovalResponse = Omit<ApiApprovalResponse, 'approval' | 'cancel'> & {
  approval: TransactionRequest | null
  cancel: TransactionRequest | null
}

export const checkApproval = async (params: ApprovalRequest): Promise<ApprovalResponse> => {
  console.log('checkApproval', params)
  const response: ApprovalResponse = {
    requestId: 'whatever',
    approval: null,
    cancel: null,
    gasFee: undefined,
    cancelGasFee: undefined,
  }
  if (params.token) {
    if (isNativeCurrencyAddress(UniverseChainId.SmartBCH, params.token)) {
      response.approval = null
    } else {
      const isApproved = await client.getL1Allowance({
        account: params.walletAddress as `0x${string}`,
        token: params.token! as `0x${string}`,
        bridgeAddress: CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH].swapRouter02Address as `0x${string}`,
      })
      response.approval =
        isApproved < BigInt(params.amount ?? 0)
          ? await client.prepareTransactionRequest({
              account: params.walletAddress! as `0x${string}`,
              to: params.token! as `0x${string}`,
              value: '0',
              data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [
                  CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH].swapRouter02Address,
                  parseEther(Number.MAX_SAFE_INTEGER.toString()),
                ],
              }),
            })
          : null
    }
  }
  console.log('checkApproval.response', response)
  return response
}
