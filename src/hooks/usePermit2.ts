import { ContractTransaction } from '@ethersproject/contracts'
import { PERMIT2_ADDRESS } from '@uniswap/permit2-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import useInterval from 'lib/hooks/useInterval'
import ms from 'ms.macro'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApproveTransactionInfo } from 'state/transactions/types'

import { PermitSignature, usePermitAllowance, useUpdatePermitAllowance } from './usePermitAllowance'
import { useTokenAllowance, useUpdateTokenAllowance } from './useTokenAllowance'

export enum PermitState {
  UNKNOWN,
  PERMIT_NEEDED,
  PERMITTED,
}

export interface Permit {
  state: PermitState
  signature?: PermitSignature
  callback?: () => Promise<{
    response: ContractTransaction
    info: ApproveTransactionInfo
  } | void>
}

export default function usePermit(amount?: CurrencyAmount<Token>, spender?: string): Permit {
  const { account } = useWeb3React()
  const tokenAllowance = useTokenAllowance(amount?.currency, account, PERMIT2_ADDRESS)
  const updateTokenAllowance = useUpdateTokenAllowance(amount, PERMIT2_ADDRESS)

  const allowanceData = usePermitAllowance(amount?.currency, spender)
  const [permitAllowance, setPermitAllowance] = useState(allowanceData?.amount)
  useEffect(() => setPermitAllowance(allowanceData?.amount), [allowanceData?.amount])

  const [signature, setSignature] = useState<PermitSignature>()
  const updatePermitAllowance = useUpdatePermitAllowance(amount?.currency, spender, allowanceData?.nonce, setSignature)

  const updateTokenAndPermitAllowance = useCallback(async () => {
    const info = await updateTokenAllowance()
    await updatePermitAllowance()
    return info
  }, [updatePermitAllowance, updateTokenAllowance])

  // Trigger a re-render if either tokenAllowance or signature expire.
  useInterval(
    () => {
      const now = Date.now() / 1000 - 12 // ensure it can still go into this block (assuming 12s block time)
      if (signature && signature.sigDeadline < now) {
        setSignature(undefined)
      }
      if (allowanceData && allowanceData.expiration < now) {
        setPermitAllowance(undefined)
      }
    },
    ms`12s`,
    true
  )

  return useMemo(() => {
    if (!amount || !tokenAllowance) {
      return { state: PermitState.UNKNOWN }
    } else if (tokenAllowance.greaterThan(amount) || tokenAllowance.equalTo(amount)) {
      if (permitAllowance?.gte(amount.quotient.toString())) {
        return { state: PermitState.PERMITTED }
      } else if (signature?.details.token === amount.currency.address && signature?.spender === spender) {
        return { state: PermitState.PERMITTED, signature }
      } else {
        return { state: PermitState.PERMIT_NEEDED, callback: updatePermitAllowance }
      }
    } else {
      return { state: PermitState.PERMIT_NEEDED, callback: updateTokenAndPermitAllowance }
    }
  }, [
    amount,
    permitAllowance,
    signature,
    spender,
    tokenAllowance,
    updatePermitAllowance,
    updateTokenAndPermitAllowance,
  ])
}
