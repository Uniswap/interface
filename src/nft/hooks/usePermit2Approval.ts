import { CurrencyAmount, Token } from '@pollum-io/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@pollum-io/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import { useCallback, useMemo, useState } from 'react'
import invariant from 'tiny-invariant'

export default function usePermit2Approval(
  amount?: CurrencyAmount<Token>,
  maximumAmount?: CurrencyAmount<Token>,
  enabled?: boolean
) {
  const { chainId } = useWeb3React()

  const allowance = usePermit2Allowance(
    enabled ? maximumAmount ?? (amount?.currency.isToken ? (amount as CurrencyAmount<Token>) : undefined) : undefined,
    enabled && chainId ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined
  )
  const isApprovalLoading = allowance.state === AllowanceState.REQUIRED && allowance.isApprovalLoading
  const [isAllowancePending, setIsAllowancePending] = useState(false)
  const updateAllowance = useCallback(async () => {
    invariant(allowance.state === AllowanceState.REQUIRED)
    setIsAllowancePending(true)
    try {
      await allowance.approveAndPermit()
    } catch (e) {
      console.error(e)
    } finally {
      setIsAllowancePending(false)
    }
  }, [allowance])

  return useMemo(() => {
    return {
      allowance,
      isApprovalLoading,
      isAllowancePending,
      updateAllowance,
    }
  }, [allowance, isAllowancePending, isApprovalLoading, updateAllowance])
}
