import { ContractTransaction } from '@ethersproject/contracts'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { AVERAGE_L1_BLOCK_TIME } from 'constants/chainInfo'
import useInterval from 'lib/hooks/useInterval'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApproveTransactionInfo } from 'state/transactions/types'

import { PermitSignature, usePermitAllowance, useUpdatePermitAllowance } from './usePermitAllowance'
import { useTokenAllowance, useUpdateTokenAllowance } from './useTokenAllowance'

export enum PermitState {
  INVALID,
  LOADING,
  PERMIT_NEEDED,
  PERMITTED,
}

export interface Permit {
  state: PermitState
  signature?: PermitSignature
  callback?: (sPendingApproval: boolean) => Promise<{
    response: ContractTransaction
    info: ApproveTransactionInfo
  } | void>
}

export default function usePermit(amount?: CurrencyAmount<Token>, spender?: string): Permit {
  const { account } = useWeb3React()
  const tokenAllowance = useTokenAllowance(amount?.currency, account, PERMIT2_ADDRESS)
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

  const callback = useCallback(
    async (isPendingApproval: boolean) => {
      let info
      if (!isAllowed && !isPendingApproval) {
        info = await updateTokenAllowance()
      }
      if (!isPermitted && !isSigned) {
        await updatePermitAllowance()
      }
      return info
    },
    [isAllowed, isPermitted, isSigned, updatePermitAllowance, updateTokenAllowance]
  )

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
    return { state: PermitState.PERMIT_NEEDED, callback }
  }, [amount, callback, isAllowed, isPermitted, isSigned, permitAllowance, signature, tokenAllowance])
}
