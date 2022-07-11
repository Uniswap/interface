import { TransactionRequest } from '@ethersproject/abstract-provider'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { Trade } from '@uniswap/router-sdk'
import { Currency, Percent, Token, TradeType } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeOptions, Trade as V3Trade } from '@uniswap/v3-sdk'
import TEX_JSON from 'abis/tex-router.json'
import { SWAP_ROUTER_ADDRESSES } from 'constants/addresses'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import JSBI from 'jsbi'
import { useMemo } from 'react'

import useENS from './useENS'
import { SignatureData } from './useERC20Permit'

export type AnyTrade =
  | V2Trade<Currency, Currency, TradeType>
  | V3Trade<Currency, Currency, TradeType>
  | Trade<Currency, Currency, TradeType>

export interface SwapCall {
  address: string
  calldata: string
  value: string
  deadline: number
  amountIn: number
  amountoutMin: number
  path: string[]
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
  _allowedSlippage: Percent,
  recipientAddressOrName: string | null | undefined,
  _signatureData: SignatureData | null | undefined,
  deadline: BigNumber | undefined,
  _feeOptions: FeeOptions | undefined
): Promise<SwapCall[]> {
  const { account, chainId, library } = useActiveWeb3React()

  const { address: recipientAddress } = useENS(recipientAddressOrName)
  const recipient = recipientAddressOrName === null ? account : recipientAddress

  return useMemo(async () => {
    if (!trade || !recipient || !library || !account || !chainId || !deadline) return []

    const v2trade = trade as V2Trade<Currency, Currency, TradeType>

    const amountIn = JSBI.toNumber(trade.inputAmount.numerator)
    const amountoutMin = 0
    const deadlineNumber = 1753105128

    const token1 = v2trade.inputAmount.currency as Token
    const address1 = token1.address
    const token2 = v2trade.outputAmount.currency as Token
    const address2 = token2.address
    const path = [address1, address2]

    const { abi: TEX_ABI } = TEX_JSON
    const texContract = new Contract(SWAP_ROUTER_ADDRESSES[chainId], TEX_ABI, library)

    const txRequest: TransactionRequest = await texContract.populateTransaction.swapExactTokensForTokens(
      `${amountIn}`,
      `${amountoutMin}`,
      path,
      account,
      deadlineNumber
    )

    return [
      {
        address: texContract.address,
        calldata: txRequest.data ? txRequest.data.toString() : '',
        value: txRequest.value ? txRequest.value.toString() : '0x00',
        deadline: deadlineNumber,
        amountIn,
        amountoutMin,
        path,
      },
    ]
  }, [account, chainId, deadline, library, recipient, trade])
}
