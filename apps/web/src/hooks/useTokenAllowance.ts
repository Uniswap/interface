import { ContractTransaction } from '@ethersproject/contracts'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { CurrencyAmount, MaxUint256, Token } from '@uniswap/sdk-core'
import { sendAnalyticsEvent, useTrace as useAnalyticsTrace } from 'analytics'
import { useTokenContract } from 'hooks/useContract'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApproveTransactionInfo, TransactionType } from 'state/transactions/types'
import { trace } from 'tracing/trace'
import { UserRejectedRequestError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

const MAX_ALLOWANCE = MaxUint256.toString()

export function useTokenAllowance(
  token?: Token,
  owner?: string,
  spender?: string
): {
  tokenAllowance?: CurrencyAmount<Token>
  isSyncing: boolean
} {
  const contract = useTokenContract(token?.address, false)
  const inputs = useMemo(() => [owner, spender], [owner, spender])

  // If there is no allowance yet, re-check next observed block.
  // This guarantees that the tokenAllowance is marked isSyncing upon approval and updated upon being synced.
  const [blocksPerFetch, setBlocksPerFetch] = useState<1>()
  const { result, syncing: isSyncing } = useSingleCallResult(contract, 'allowance', inputs, { blocksPerFetch }) as {
    result?: Awaited<ReturnType<NonNullable<typeof contract>['allowance']>>
    syncing: boolean
  }

  const rawAmount = result?.toString() // convert to a string before using in a hook, to avoid spurious rerenders
  const allowance = useMemo(
    () => (token && rawAmount ? CurrencyAmount.fromRawAmount(token, rawAmount) : undefined),
    [token, rawAmount]
  )
  useEffect(() => setBlocksPerFetch(allowance?.equalTo(0) ? 1 : undefined), [allowance])

  return useMemo(() => ({ tokenAllowance: allowance, isSyncing }), [allowance, isSyncing])
}

export function useUpdateTokenAllowance(
  amount: CurrencyAmount<Token> | undefined,
  spender: string
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const contract = useTokenContract(amount?.currency.address)
  const analyticsTrace = useAnalyticsTrace()

  return useCallback(
    () =>
      trace({ name: 'Allowance', op: 'permit.allowance' }, async (trace) => {
        try {
          if (!amount) throw new Error('missing amount')
          if (!contract) throw new Error('missing contract')
          if (!spender) throw new Error('missing spender')

          const allowance = amount.equalTo(0) ? '0' : MAX_ALLOWANCE
          const response = await trace.child({ name: 'Approve', op: 'wallet.approve' }, async (walletTrace) => {
            try {
              return await contract.approve(spender, allowance)
            } catch (error) {
              if (didUserReject(error)) {
                walletTrace.setStatus('cancelled')
                const symbol = amount?.currency.symbol ?? 'Token'
                throw new UserRejectedRequestError(`${symbol} token allowance failed: User rejected`)
              } else {
                throw error
              }
            }
          })
          sendAnalyticsEvent(InterfaceEventName.APPROVE_TOKEN_TXN_SUBMITTED, {
            chain_id: amount.currency.chainId,
            token_symbol: amount.currency.symbol,
            token_address: amount.currency.address,
            ...analyticsTrace,
          })
          return {
            response,
            info: {
              type: TransactionType.APPROVAL,
              tokenAddress: contract.address,
              spender,
              amount: allowance,
            },
          }
        } catch (error: unknown) {
          if (error instanceof UserRejectedRequestError) {
            trace.setStatus('cancelled')
            throw error
          } else {
            const symbol = amount?.currency.symbol ?? 'Token'
            throw new Error(`${symbol} token allowance failed: ${error instanceof Error ? error.message : error}`)
          }
        }
      }),
    [amount, contract, spender, analyticsTrace]
  )
}

export function useRevokeTokenAllowance(
  token: Token | undefined,
  spender: string
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const amount = useMemo(() => (token ? CurrencyAmount.fromRawAmount(token, 0) : undefined), [token])

  return useUpdateTokenAllowance(amount, spender)
}
