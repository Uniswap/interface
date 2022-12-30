import { BigNumber } from '@ethersproject/bignumber'
import { SwapRouter, Trade } from '@uniswap/router-sdk'
import { Currency, Percent, TradeType } from '@uniswap/sdk-core'
import { FeeOptions } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import { useMemo } from 'react'
import approveAmountCalldata from 'utils/approveAmountCalldata'

import { useArgentWalletContract } from './useArgentWalletContract'
import useENS from './useENS'
import { SignatureData } from './useERC20Permit'

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
  trade: Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent,
  recipientAddressOrName: string | null | undefined,
  signatureData: SignatureData | null | undefined,
  deadline: BigNumber | undefined,
  feeOptions: FeeOptions | undefined
): SwapCall[] {
  const { account, chainId, provider } = useWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress
  const argentWalletContract = useArgentWalletContract()

  return useMemo(() => {
    if (!trade || !recipient || !provider || !account || !chainId || !deadline) return []

    const swapRouterAddress = chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined
    if (!swapRouterAddress) return []

    const { value, calldata } = SwapRouter.swapCallParameters(trade, {
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

      deadlineOrPreviousBlockhash: deadline.toString(),
    })

    if (argentWalletContract && trade.inputAmount.currency.isToken) {
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
  }, [
    account,
    allowedSlippage,
    argentWalletContract,
    chainId,
    deadline,
    feeOptions,
    provider,
    recipient,
    signatureData,
    trade,
  ])
}
