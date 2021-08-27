import { useContractKit, useGetConnectedSigner } from '@celo-tools/use-contractkit'
import { MaxUint256 } from '@ethersproject/constants'
import { TokenAmount, Trade } from '@ubeswap/sdk'
import { useDoTransaction } from 'components/swap/routing'
import { MoolaRouterTrade } from 'components/swap/routing/hooks/useTrade'
import { MoolaDirectTrade } from 'components/swap/routing/moola/MoolaDirectTrade'
import { useMoolaConfig } from 'components/swap/routing/moola/useMoola'
import { useCallback, useMemo } from 'react'
import { useUserMinApprove } from 'state/user/hooks'

import { ROUTER_ADDRESS, UBESWAP_MOOLA_ROUTER_ADDRESS } from '../constants'
import { useTokenAllowance } from '../data/Allowances'
import { Field } from '../state/swap/actions'
import { useHasPendingApproval } from '../state/transactions/hooks'
import { computeSlippageAdjustedAmounts } from '../utils/prices'
import { useTokenContract } from './useContract'

export enum ApprovalState {
  UNKNOWN,
  NOT_APPROVED,
  PENDING,
  APPROVED,
}

// returns a variable indicating the state of the approval and a function which approves if necessary or early returns
export function useApproveCallback(
  amountToApprove?: TokenAmount,
  spender?: string
): [ApprovalState, () => Promise<void>] {
  const { address: account } = useContractKit()
  const getConnectedSigner = useGetConnectedSigner()

  const token = amountToApprove instanceof TokenAmount ? amountToApprove.token : undefined
  const [minApprove] = useUserMinApprove()
  const currentAllowance = useTokenAllowance(token, account ?? undefined, spender)
  const pendingApproval = useHasPendingApproval(token?.address, spender)

  // check the current approval status
  const approvalState: ApprovalState = useMemo(() => {
    if (!amountToApprove || !spender) return ApprovalState.UNKNOWN
    // we might not have enough data to know whether or not we need to approve
    if (!currentAllowance) return ApprovalState.UNKNOWN

    // amountToApprove will be defined if currentAllowance is
    return currentAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, currentAllowance, pendingApproval, spender])

  const tokenContractDisconnected = useTokenContract(token?.address)
  const doTransaction = useDoTransaction()

  const approve = useCallback(async (): Promise<void> => {
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      console.error('approve was called unnecessarily')
      return
    }
    if (!token) {
      console.error('no token')
      return
    }

    if (!tokenContractDisconnected) {
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

    // connect
    const tokenContract = tokenContractDisconnected.connect(await getConnectedSigner())

    if (minApprove) {
      await doTransaction(tokenContract, 'approve', {
        args: [spender, amountToApprove.raw.toString()],
        summary: `Approve ${amountToApprove.toSignificant(6)} ${amountToApprove.currency.symbol}`,
        approval: { tokenAddress: token.address, spender: spender },
      })
    } else {
      await doTransaction(tokenContract, 'approve', {
        args: [spender, MaxUint256],
        summary: `Approve ${amountToApprove.currency.symbol}`,
        approval: { tokenAddress: token.address, spender: spender },
      })
    }
  }, [
    approvalState,
    token,
    tokenContractDisconnected,
    amountToApprove,
    spender,
    getConnectedSigner,
    minApprove,
    doTransaction,
  ])

  return [approvalState, approve]
}

// wraps useApproveCallback in the context of a swap
export function useApproveCallbackFromTrade(trade?: Trade, allowedSlippage = 0) {
  const amountToApprove = useMemo(
    () => (trade ? computeSlippageAdjustedAmounts(trade, allowedSlippage)[Field.INPUT] : undefined),
    [trade, allowedSlippage]
  )
  const moola = useMoolaConfig()
  return useApproveCallback(
    amountToApprove,
    trade instanceof MoolaDirectTrade
      ? moola?.lendingPoolCore
      : trade instanceof MoolaRouterTrade
      ? UBESWAP_MOOLA_ROUTER_ADDRESS
      : ROUTER_ADDRESS
  )
}
