import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { SWAP_ROUTER_ADDRESSES, V2_ROUTER_ADDRESS } from '../constants/addresses'
import { Trade as V3Trade, toHex } from '@uniswap/v3-sdk'
import { useCallback, useMemo } from 'react'
import { useHasPendingApproval, useTransactionAdder } from '../state/transactions/hooks'

import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import axios from 'axios'
import { calculateGasMargin } from '../utils/calculateGasMargin'
import { useActiveWeb3React } from './web3'
import { useTokenAllowance } from './useTokenAllowance'
import { useTokenContract } from './useContract'
import { useUserGasPreference } from 'state/user/hooks'

export enum ApprovalState {
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount<Currency>,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const { account, chainId } = useActiveWeb3React()
  const token = amountToApprove?.currency?.isToken ? amountToApprove.currency : undefined
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency.isNative) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  async function getCurrentGasPrices() {
    const fetchEndpoint = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=2SIRTH18CHU6HM22AGRF1XE9M7AKDR9PM7`
    const response = await axios.get(fetchEndpoint);
    const prices = {
      low: response.data.result.SafeGasPrice,
      medium: response.data.result.ProposeGasPrice,
      // add 5 to the recommended gas produced by etherscan..
      high: (parseInt(response.data.result.FastGasPrice) + 5),
      ultra: (parseInt(response.data.result.FastGasPrice) + 12)
    };
    return prices;
}

  const tokenContract = useTokenContract(token?.address)
  const addTransaction = useTransactionAdder()
  const gasSettings = useUserGasPreference()
  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!chainId) {
      console.error('no chainId')
      return
    }

    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContract) {
      console.error('tokenContract is null')
      return
    }

    if (!amountToApprove) {
      console.error('missing amount to approve')
      return
    }

    if (!spender) {
      console.error('no spender')
      return
    }

    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString())
    })
    const gasPrices = await getCurrentGasPrices()
    let gasPrice = toHex((+gasPrices.high * 1e9))

    if (gasSettings?.low) {
      gasPrice = toHex((+gasPrices.low  * 1e9))
    } else if (gasSettings?.medium) {
      gasPrice = toHex((+gasPrices.medium  * 1e9))
    } else if (gasSettings?.high) {
      gasPrice = toHex((+gasPrices.high  * 1e9))
    } else if (gasSettings?.ultra)  {
      const ultraGasPrice = +gasPrices.high + 12;
      gasPrice = toHex((+ultraGasPrice * 1e9));
    } else if (gasSettings?.custom && gasSettings?.custom > 0) {
      gasPrice = toHex((+gasSettings?.custom * 1e9))
    }
  
    return tokenContract
      .approve(spender, useExact ? amountToApprove.quotient.toString() : MaxUint256, {
        gasLimit: calculateGasMargin(chainId, estimatedGas),
        gasPrice
      })
      .then((response: TransactionResponse) => {
        addTransaction(response, {
          summary: 'Approve ' + amountToApprove.currency.symbol,
          approval: { tokenAddress: token.address, spender: spender },
        })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransaction, chainId])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(
  trade: V2Trade<Currency, Currency, TradeType> | V3Trade<Currency, Currency, TradeType> | undefined,
  allowedSlippage: Percent
) {
  const { chainId } = useActiveWeb3React()
  const v3SwapRouterAddress = chainId ? SWAP_ROUTER_ADDRESSES[chainId] : undefined
  const amountToApprove = useMemo(
    () => (trade && trade.inputAmount.currency.isToken ? trade.maximumAmountIn(allowedSlippage) : undefined),
    [trade, allowedSlippage]
  )
  return useApproveCallback(
    amountToApprove,
    chainId
      ? trade instanceof V2Trade
        ? V2_ROUTER_ADDRESS[chainId]
        : trade instanceof V3Trade
        ? v3SwapRouterAddress
        : undefined
      : undefined
  )
}
