import { MaxUint256 } from '@ethersproject/constants'
import { TransactionResponse } from '@ethersproject/providers'
import { CurrencyAmount, ETHER, TokenAmount, Trade, ZERO } from '@dynamic-amm/sdk'
import { useCallback, useMemo } from 'react'
import { ROUTER_ADDRESSES, ROUTER_ADDRESSES_V2 } from 'constants/index'
import { useTokenAllowance } from 'data/Allowances'
import { Field } from 'state/swap/actions'
import { useHasPendingApproval, useTransactionAdder } from 'state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from 'utils/prices'
import { calculateGasMargin } from 'utils'
import { useTokenContract } from './useContract'
import { useActiveWeb3React } from './index'
import { convertToNativeTokenFromETH } from 'utils/dmm'
import { Aggregator } from 'utils/aggregator'
import { useSelector } from 'react-redux'
import { ethers } from 'ethers'
import { AppState } from 'state'

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: CurrencyAmount,
  spender?: string,
): [ApprovalState, () => Promise<void>] {
  const { account, chainId } = useActiveWeb3React()
  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)
  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    if (amountToApprove.currency === ETHER) return ApprovalState.APPROVED
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // Handle farm approval.
    if (amountToApprove.raw.toString() === MaxUint256.toString()) {
      return currentAllowance.equalTo(ZERO)
        ? pendingApproval
          ? ApprovalState.PENDING
          : ApprovalState.NOT_APPROVED
        : ApprovalState.APPROVED
    }

    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContract = useTokenContract(token?.address)
  const addTransactionWithType = useTransactionAdder()

  const gasPrice = useSelector((state: AppState) => state.application.gasPrice)
  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
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
    let needRevoke = false

    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens who restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.raw.toString()).catch(() => {
        needRevoke = true
        return tokenContract.estimateGas.approve(spender, '0')
      })
    })

    console.log(
      '[gas_price] approval used: ',
      gasPrice?.standard ? `api/node: ${gasPrice?.standard} wei` : 'metamask default',
    )

    if (needRevoke) {
      return tokenContract.approve(spender, '0', {
        ...(gasPrice?.standard ? { gasPrice: ethers.utils.parseUnits(gasPrice?.standard, 'wei') } : {}),
        gasLimit: calculateGasMargin(estimatedGas),
      })
    }

    return tokenContract
      .approve(spender, useExact ? amountToApprove.raw.toString() : MaxUint256, {
        ...(gasPrice?.standard ? { gasPrice: ethers.utils.parseUnits(gasPrice?.standard, 'wei') } : {}),
        gasLimit: calculateGasMargin(estimatedGas),
      })
      .then((response: TransactionResponse) => {
        addTransactionWithType(response, {
          type: 'Approve',
          summary: convertToNativeTokenFromETH(amountToApprove.currency, chainId).symbol,
          approval: { tokenAddress: token.address, spender: spender },
        })
      })
      .catch((error: Error) => {
        console.debug('Failed to approve token', error)
        throw error
      })
  }, [approvalState, token, tokenContract, amountToApprove, spender, addTransactionWithType, chainId, gasPrice])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade, allowedSlippage = 0) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage],
  )
  return useApproveCallback(amountToApprove, !!chainId ? ROUTER_ADDRESSES[chainId] : undefined)
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTradeV2(trade?: Aggregator, allowedSlippage = 0) {
  const { chainId } = useActiveWeb3React()
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage],
  )
  return useApproveCallback(amountToApprove, !!chainId ? ROUTER_ADDRESSES_V2[chainId] : undefined)
}
