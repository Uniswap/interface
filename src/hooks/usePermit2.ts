import { ContractTransaction } from '@ethersproject/contracts'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import useInterval from 'lib/hooks/useInterval'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useHasPendingApproval } from 'state/transactions/hooks'
import { ApproveTransactionInfo } from 'state/transactions/types'

import { PermitSignature, usePermitAllowance, useUpdatePermitAllowance } from './usePermitAllowance'
import { useTokenAllowance, useUpdateTokenAllowance } from './useTokenAllowance'

enum SyncState {
  PENDING,
  SYNCING,
  SYNCED,
}

export enum PermitState {
  INVALID,
  LOADING,
  PERMIT_NEEDED,
  PERMITTED,
}

export interface Permit {
  state: PermitState
  isSyncing?: boolean
  signature?: PermitSignature
  callback?: () => Promise<{
    response: ContractTransaction
    info: ApproveTransactionInfo
  } | void>
}

export default function usePermit(amount?: CurrencyAmount<Token>, spender?: string): Permit {
  const { account } = useWeb3React()
  const { tokenAllowance, isSyncing: isApprovalSyncing } = useTokenAllowance(amount?.currency, account, PERMIT2_ADDRESS)
  const updateTokenAllowance = useUpdateTokenAllowance(amount, PERMIT2_ADDRESS)
  const isAllowed = useMemo(
    () => amount && (tokenAllowance?.greaterThan(amount) || tokenAllowance?.equalTo(amount)),
    [amount, tokenAllowance]
  )

  const permitAllowance = usePermitAllowance(amount?.currency, spender)
  const [permitAllowanceAmount, setPermitAllowanceAmount] = useState(permitAllowance?.amount)
  useEffect(() => setPermitAllowanceAmount(permitAllowance?.amount), [permitAllowance?.amount])
  const isPermitted = useMemo(
    () => amount && permitAllowanceAmount?.gte(amount.quotient.toString()),
    [amount, permitAllowanceAmount]
  )

  const [signature, setSignature] = useState<PermitSignature>()
  const updatePermitAllowance = useUpdatePermitAllowance(
    amount?.currency,
    spender,
    permitAllowance?.nonce,
    setSignature
  )
  const isSigned = useMemo(
    () => amount && signature?.details.token === amount?.currency.address && signature?.spender === spender,
    [amount, signature?.details.token, signature?.spender, spender]
  )

  // Trigger a re-render if either tokenAllowance or signature expire.
  useInterval(
    () => {
      // Calculate now such that the signature will still be valid for the next block.
      const now = (Date.now() - AVERAGE_L1_BLOCK_TIME) / 1000
      if (signature && signature.sigDeadline < now) {
        setSignature(undefined)
      }
      if (permitAllowance && permitAllowance.expiration < now) {
        setPermitAllowanceAmount(undefined)
      }
    },
    AVERAGE_L1_BLOCK_TIME,
    true
  )

  // Permit2 should be marked syncing from the time approval is submitted (pending) until it is
  // synced in tokenAllowance, to avoid re-prompting the user for an already-submitted approval.
  // It should *not* be marked syncing if not permitted, because the user must still take action.
  const [syncState, setSyncState] = useState(SyncState.SYNCED)
  const isSyncing = isPermitted || isSigned ? false : syncState !== SyncState.SYNCED
  const hasPendingApproval = useHasPendingApproval(amount?.currency, PERMIT2_ADDRESS)
  useEffect(() => {
    if (hasPendingApproval) {
      setSyncState(SyncState.PENDING)
    } else {
      setSyncState((state) => {
        if (state === SyncState.PENDING && isApprovalSyncing) {
          return SyncState.SYNCING
        } else if (state === SyncState.SYNCING && !isApprovalSyncing) {
          return SyncState.SYNCED
        } else {
          return state
        }
      })
    }
  }, [hasPendingApproval, isApprovalSyncing])

  const callback = useCallback(async () => {
    let info
    if (!isAllowed && !hasPendingApproval) {
      info = await updateTokenAllowance()
    }
    if (!isPermitted && !isSigned) {
      await updatePermitAllowance()
    }
    return info
  }, [hasPendingApproval, isAllowed, isPermitted, isSigned, updatePermitAllowance, updateTokenAllowance])

  return useMemo(() => {
    if (!amount) {
      return { state: PermitState.INVALID }
    } else if (!tokenAllowance || !permitAllowance) {
      return { state: PermitState.LOADING }
    } else if (isAllowed) {
      if (isPermitted) {
        return { state: PermitState.PERMITTED }
      } else if (isSigned) {
        return { state: PermitState.PERMITTED, signature }
      }
    }
    return { state: PermitState.PERMIT_NEEDED, isSyncing, callback }
  }, [amount, callback, isAllowed, isPermitted, isSigned, isSyncing, permitAllowance, signature, tokenAllowance])
}
