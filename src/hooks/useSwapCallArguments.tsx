import { BigNumber } from '@ethersproject/bignumber'
import { SwapRouter, Trade } from '@uniswap/router-sdk'
import { Currency, MaxUint256, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Router as V2SwapRouter, Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeOptions, SwapRouter as V3SwapRouter, Trade as V3Trade } from '@uniswap/v3-sdk'
import { SWAP_ROUTER_ADDRESSES, V3_ROUTER_ADDRESS } from 'constants/addresses'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useMemo } from 'react'
import approveAmountCalldata from 'utils/approveAmountCalldata'

import { ApprovalState, useApproveCallbackFromTrade } from './useApproveCallback'
import { useArgentWalletContract } from './useArgentWalletContract'
import { useTokenContract, useV2RouterContract } from './useContract'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'
import useIsAmbireWC from './useIsAmbireWC'

export type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

interface SwapCall {
  address: string
  calldata: string
  value: string
}

/**
 * Returns the swap calls that can be used to make the trade
 * @param trade trade to execute
 * @param allowedSlippage user allowed slippage
 * @param recipientAddressOrName the ENS name or address of the recipient of the swap output
 * @param signatureData the signature data of the permit of the input token amount, if available
 */
export function useSwapCallArguments(
  trade: AnyTrade | undefined,
  allowedSlippage: Percent,
  recipientAddressOrName: string | null | undefined,
  signatureData: SignatureData | null | undefined,
  deadline: BigNumber | undefined,
  feeOptions: FeeOptions | undefined
): SwapCall[] {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const routerContract = useV2RouterContract()
  const argentWalletContract = useArgentWalletContract()

  const [approvalState] = useApproveCallbackFromTrade(trade as Trade<Currency, Currency, TradeType>, allowedSlippage)

  const token = trade?.inputAmount.currency as Token
  const tokenContract = useTokenContract(token?.address)

  const isAmbireWC = useIsAmbireWC()

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !chainId || !deadline) return []

    if (trade instanceof V2Trade) {
      if (!routerContract) return []
      const swapMethods = []

      swapMethods.push(
        V2SwapRouter.swapCallParameters(trade, {
          feeOnTransfer: false,
          allowedSlippage,
          recipient,
          deadline: deadline.toNumber(),
        })
      )

      if (trade.tradeType === TradeType.EXACT_INPUT) {
        swapMethods.push(
          V2SwapRouter.swapCallParameters(trade, {
            feeOnTransfer: true,
            allowedSlippage,
            recipient,
            deadline: deadline.toNumber(),
          })
        )
      }
      return swapMethods.map(({ methodName, args, value }) => {
        if (isAmbireWC && trade.inputAmount.currency.isToken && approvalState === ApprovalState.NOT_APPROVED) {
          const approveData = tokenContract?.interface?.encodeFunctionData('approve', [
            routerContract.address,
            MaxUint256.toString(),
          ])

          const swapData = routerContract.interface.encodeFunctionData(methodName, args)

          return {
            address: '',
            calldata: '',
            value,
            skipGasEstimation: true,
            extra: [
              {
                to: tokenContract?.address,
                calldata: approveData,
              },
              {
                to: routerContract.address,
                calldata: swapData,
              },
            ],
          }
        } else if (argentWalletContract && trade.inputAmount.currency.isToken) {
          return {
            address: argentWalletContract.address,
            calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
              [
                approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), routerContract.address),
                {
                  to: routerContract.address,
                  value,
                  data: routerContract.interface.encodeFunctionData(methodName, args),
                },
              ],
            ]),
            value: '0x0',
          }
        } else {
          return {
            address: routerContract.address,
            calldata: routerContract.interface.encodeFunctionData(methodName, args),
            value,
          }
        }
      })
    } else {
      // swap options shared by v3 and v2+v3 swap routers
      const sharedSwapOptions = {
        fee: feeOptions,
        recipient,
        slippageTolerance: allowedSlippage,
        ...(signatureData
          ? {
              inputTokenPermit:
                'allowed' in signatureData
                  ? {
                      expiry: signatureData.deadline,
                      nonce: signatureData.nonce,
                      s: signatureData.s,
                      r: signatureData.r,
                      v: signatureData.v as any,
                    }
                  : {
                      deadline: signatureData.deadline,
                      amount: signatureData.amount,
                      s: signatureData.s,
                      r: signatureData.r,
                      v: signatureData.v as any,
                    },
            }
          : {}),
      }

      const swapRouterAddress = chainId
        ? trade instanceof V3Trade
          ? V3_ROUTER_ADDRESS[chainId]
          : SWAP_ROUTER_ADDRESSES[chainId]
        : undefined
      if (!swapRouterAddress) return []

      const { value, calldata } =
        trade instanceof V3Trade
          ? V3SwapRouter.swapCallParameters(trade, {
              ...sharedSwapOptions,
              deadline: deadline.toString(),
            })
          : SwapRouter.swapCallParameters(trade, {
              ...sharedSwapOptions,
              deadlineOrPreviousBlockhash: deadline.toString(),
            })

      if (isAmbireWC && trade.inputAmount.currency.isToken && approvalState === ApprovalState.NOT_APPROVED) {
        const approveData = tokenContract?.interface?.encodeFunctionData('approve', [
          swapRouterAddress,
          MaxUint256.toString(),
        ])

        return [
          {
            address: '',
            calldata: '',
            value,
            skipGasEstimation: true,
            extra: [
              {
                to: tokenContract?.address,
                data: approveData,
              },
              {
                to: swapRouterAddress,
                data: calldata,
              },
            ],
          },
        ]
      } else if (argentWalletContract && trade.inputAmount.currency.isToken) {
        return [
          {
            address: argentWalletContract.address,
            calldata: argentWalletContract.interface.encodeFunctionData('wc_multiCall', [
              [
                approveAmountCalldata(trade.maximumAmountIn(allowedSlippage), swapRouterAddress),
                {
                  to: swapRouterAddress,
                  value,
                  data: calldata,
                },
              ],
            ]),
            value: '0x0',
          },
        ]
      }
      return [
        {
          address: swapRouterAddress,
          calldata,
          value,
        },
      ]
    }
  }, [
    account,
    allowedSlippage,
    argentWalletContract,
    approvalState,
    chainId,
    deadline,
    feeOptions,
    library,
    recipient,
    routerContract,
    signatureData,
    trade,
    tokenContract,
    isAmbireWC,
  ])
}
