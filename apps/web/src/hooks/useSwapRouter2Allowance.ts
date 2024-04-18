import type { CurrencyAmount, Token } from '@jaguarswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useRevokeTokenAllowance, useTokenAllowance, useUpdateTokenAllowance } from 'hooks/useTokenAllowance'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TradeFillType } from 'state/routing/types'
import { useHasPendingApproval, useHasPendingRevocation, useTransactionAdder } from 'state/transactions/hooks'

enum ApprovalState {
  PENDING = 0,
  SYNCING = 1,
  SYNCED = 2,
}

export enum AllowanceState {
  LOADING = 0,
  REQUIRED = 1,
  ALLOWED = 2,
}

interface AllowanceRequired {
  state: AllowanceState.REQUIRED
  token: Token
  isApprovalLoading: boolean
  isApprovalPending: boolean
  isRevocationPending: boolean
  approve: () => Promise<void>
  revoke: () => Promise<void>
  needsSetupApproval: boolean
  allowedAmount: CurrencyAmount<Token>
}

export type Allowance =
  | { state: AllowanceState.LOADING }
  | {
      state: AllowanceState.ALLOWED
    }
  | AllowanceRequired

export default function useSwapRouter2Allowance(amount?: CurrencyAmount<Token>, spender?: string, tradeFillType?: TradeFillType): Allowance {
  const { account } = useWeb3React()
  const token = amount?.currency

  const { tokenAllowance, isSyncing: isApprovalSyncing } = useTokenAllowance(token, account, spender)
  const updateTokenAllowance = useUpdateTokenAllowance(amount, spender)
  const revokeTokenAllowance = useRevokeTokenAllowance(token, spender)
  const isApproved = useMemo(() => {
    if (!amount || !tokenAllowance) return false
    return tokenAllowance.greaterThan(amount) || tokenAllowance.equalTo(amount)
  }, [amount, tokenAllowance])

  // Marks approval as loading from the time it is submitted (pending), until it has confirmed and another block synced.
  // This avoids re-prompting the user for an already-submitted but not-yet-observed approval, by marking it loading
  // until it has been re-observed. It wll sync immediately, because confirmation fast-forwards the block number.
  const [approvalState, setApprovalState] = useState(ApprovalState.SYNCED)
  const isApprovalLoading = approvalState !== ApprovalState.SYNCED
  const isApprovalPending = useHasPendingApproval(token, spender)
  const isRevocationPending = useHasPendingRevocation(token, spender)

  useEffect(() => {
    if (isApprovalPending) {
      setApprovalState(ApprovalState.PENDING)
    } else {
      setApprovalState((state) => {
        if (state === ApprovalState.PENDING && isApprovalSyncing) {
          return ApprovalState.SYNCING
        }
        if (state === ApprovalState.SYNCING && !isApprovalSyncing) {
          return ApprovalState.SYNCED
        }
        return state
      })
    }
  }, [isApprovalPending, isApprovalSyncing])

  const shouldRequestApproval = !(isApproved || isApprovalLoading)

  const addTransaction = useTransactionAdder()
  const approveAndPermit = useCallback(async () => {
    if (shouldRequestApproval) {
      const { response, info } = await updateTokenAllowance()
      addTransaction(response, info)
    }
  }, [addTransaction, shouldRequestApproval, updateTokenAllowance])

  const approve = useCallback(async () => {
    const { response, info } = await updateTokenAllowance()
    addTransaction(response, info)
  }, [addTransaction, updateTokenAllowance])

  const revoke = useCallback(async () => {
    const { response, info } = await revokeTokenAllowance()
    addTransaction(response, info)
  }, [addTransaction, revokeTokenAllowance])

  return useMemo(() => {
    if (token) {
      if (!tokenAllowance) {
        return { state: AllowanceState.LOADING }
      }
      if (!isApproved) {
        return {
          token,
          state: AllowanceState.REQUIRED,
          isApprovalLoading,
          isApprovalPending,
          isRevocationPending,
          approveAndPermit,
          approve,
          revoke,
          needsSetupApproval: true,
          allowedAmount: tokenAllowance,
        }
      }
    }
    return {
      token,
      state: AllowanceState.ALLOWED,
      needsSetupApproval: false,
    }
  }, [approve, approveAndPermit, isApprovalLoading, isApprovalPending, isApproved, revoke, isRevocationPending, token, tokenAllowance])
}
