import { MaxUint256 } from '@ethersproject/constants'
import type { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useTokenContract } from 'hooks/useContract'
import { useTokenAllowance } from 'hooks/useTokenAllowance'
import { getTokenAddress } from 'lib/utils/analytics'
import { useCallback, useMemo } from 'react'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { logger } from 'utilities/src/logger/logger'
import { calculateGasMargin } from 'utils/calculateGasMargin'

export enum ApprovalState {
  UNKNOWN = 'UNKNOWN',
  NOT_APPROVED = 'NOT_APPROVED',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}

function useApprovalStateForSpender({
  amountToApprove,
  spender,
  useIsPendingApproval,
}: {
  amountToApprove?: CurrencyAmount<Currency>
  spender?: string
  useIsPendingApproval: (token?: Token, spender?: string) => boolean
}): ApprovalState {
  const account = useAccount()
  const token = amountToApprove?.currency.isToken ? amountToApprove.currency : undefined

  const { tokenAllowance } = useTokenAllowance({ token, owner: account.address, spender })
  const pendingApproval = useIsPendingApproval(token, spender)

  return useMemo(() => {
    if (!amountToApprove || !spender) {
      return ApprovalState.UNKNOWN
    }
    if (amountToApprove.currency.isNative) {
      return ApprovalState.APPROVED
    }
    // we might not have enough data to know whether or not we need to approve
    if (!tokenAllowance) {
      return ApprovalState.UNKNOWN
    }

    // amountToApprove will be defined if tokenAllowance is
    return tokenAllowance.lessThan(amountToApprove)
      ? pendingApproval
        ? ApprovalState.PENDING
        : ApprovalState.NOT_APPROVED
      : ApprovalState.APPROVED
  }, [amountToApprove, pendingApproval, spender, tokenAllowance])
}

export function useApproval({
  amountToApprove,
  spender,
  useIsPendingApproval,
}: {
  amountToApprove?: CurrencyAmount<Currency>
  spender?: string
  useIsPendingApproval: (token?: Token, spender?: string) => boolean
}): [
  ApprovalState,
  () => Promise<
    | { response: TransactionResponse; tokenAddress: string; spenderAddress: string; amount: CurrencyAmount<Currency> }
    | undefined
  >,
] {
  const { chainId } = useAccount()
  const token = amountToApprove?.currency.isToken ? amountToApprove.currency : undefined

  // check the current approval status
  const approvalState = useApprovalStateForSpender({
    amountToApprove,
    spender,
    useIsPendingApproval,
  })

  const tokenContract = useTokenContract({
    tokenAddress: token?.address,
    withSignerIfPossible: true,
    chainId: token?.chainId,
  })

  const approve = useCallback(async () => {
    function logFailure(error: Error | string): undefined {
      if (typeof error === 'string') {
        logger.debug('useApproval', 'approve', error)
      } else {
        logger.debug('useApproval', 'approve', 'Failed to approve amount', {
          error,
          tokenChain: token?.chainId,
          token: token?.address,
          chainId,
          amountToApprove: amountToApprove?.toFixed(),
        })
      }

      return
    }

    // Bail early if there is an issue.
    if (approvalState !== ApprovalState.NOT_APPROVED) {
      return logFailure('approve was called unnecessarily')
    } else if (!chainId) {
      return logFailure('no chainId')
    } else if (!token) {
      return logFailure('no token')
    } else if (!tokenContract) {
      return logFailure('tokenContract is null')
    } else if (!amountToApprove) {
      return logFailure('missing amount to approve')
    } else if (!spender) {
      return logFailure('no spender')
    }

    let useExact = false
    const estimatedGas = await tokenContract.estimateGas.approve(spender, MaxUint256).catch(() => {
      // general fallback for tokens which restrict approval amounts
      useExact = true
      return tokenContract.estimateGas.approve(spender, amountToApprove.quotient.toString())
    })

    return (
      tokenContract
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        .approve(spender, useExact ? amountToApprove.quotient.toString() : MaxUint256, {
          gasLimit: calculateGasMargin(estimatedGas),
        })
        .then((response) => {
          const eventProperties = {
            chain_id: chainId,
            token_symbol: token.symbol,
            token_address: getTokenAddress(token),
          }
          sendAnalyticsEvent(InterfaceEventName.ApproveTokenTxnSubmitted, eventProperties)
          return {
            response,
            tokenAddress: token.address,
            spenderAddress: spender,
            amount: amountToApprove,
          }
        })
        .catch((error: Error) => {
          logFailure(error)
          throw error
        })
    )
  }, [approvalState, token, tokenContract, amountToApprove, spender, chainId])

  return [approvalState, approve]
}
