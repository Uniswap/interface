import { parseEther } from '@ethersproject/units'
import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import { CheckApprovalLPRequest, CheckApprovalLPResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { encodeFunctionData } from 'viem'
import { ERC20_ABI } from '../abi'
import { client } from '../client'

export const checkLpApproval = async (params: CheckApprovalLPRequest): Promise<CheckApprovalLPResponse> => {
  const response: CheckApprovalLPResponse = {
    requestId: 'whatever', // Generate a request ID if not provided
    token0Approval: undefined,
    token1Approval: undefined,
    token0Cancel: undefined,
    token1Cancel: undefined,
    positionTokenApproval: undefined,
    permitData: undefined,
    gasFeeToken0Approval: '0',
    gasFeeToken1Approval: '0',
    gasFeePositionTokenApproval: '0',
    gasFeeToken0Cancel: '0',
    gasFeeToken1Cancel: '0',
  }
  if (params.token0) {
    if (isNativeCurrencyAddress(UniverseChainId.SmartBCH, params.token0)) {
      response.token0Approval = undefined
    } else {
      const isApproved = await client.getL1Allowance({
        account: params.walletAddress! as `0x${string}`,
        token: params.token0! as `0x${string}`,
        bridgeAddress: CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH]
          .nonfungiblePositionManagerAddress as `0x${string}`,
      })
      response.token0Approval =
        isApproved < BigInt(params.amount0 ?? 0)
          ? await client.prepareTransactionRequest({
              account: params.walletAddress! as `0x${string}`,
              to: params.token0! as `0x${string}`,
              data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [
                  CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH].nonfungiblePositionManagerAddress,
                  parseEther(Number.MAX_SAFE_INTEGER.toString()).toString(),
                ],
              }),
            })
          : undefined
    }
  }

  if (params.token1) {
    if (isNativeCurrencyAddress(UniverseChainId.SmartBCH, params.token1)) {
      response.token1Approval = undefined
    } else {
      const isApproved = await client.getL1Allowance({
        account: params.walletAddress! as `0x${string}`,
        token: params.token1! as `0x${string}`,
        bridgeAddress: CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH]
          .nonfungiblePositionManagerAddress as `0x${string}`,
      })
      response.token1Approval =
        isApproved < BigInt(params.amount0 ?? 0)
          ? await client.prepareTransactionRequest({
              account: params.walletAddress! as `0x${string}`,
              to: params.token1! as `0x${string}`,
              data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [
                  CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH].nonfungiblePositionManagerAddress,
                  parseEther(Number.MAX_SAFE_INTEGER.toString()).toString(),
                ],
              }),
            })
          : undefined
    }
  }

  return response
}
