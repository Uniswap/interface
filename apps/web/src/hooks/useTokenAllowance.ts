import { ContractTransaction } from '@ethersproject/contracts'
import { CurrencyAmount, MaxUint256, Token } from '@uniswap/sdk-core'
import { useTokenContract } from 'hooks/useContract'
import { useTriggerOnTransactionType } from 'hooks/useTriggerOnTransactionType'
import { useCallback, useMemo, useRef } from 'react'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ApproveTransactionInfo, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { UserRejectedRequestError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { assume0xAddress } from 'utils/wagmi'
import { erc20Abi } from 'viem'
import { useReadContract } from 'wagmi'

const MAX_ALLOWANCE = MaxUint256.toString()

export function useTokenAllowance({ token, owner, spender }: { token?: Token; owner?: string; spender?: string }): {
  tokenAllowance?: CurrencyAmount<Token>
  isSyncing: boolean
} {
  const queryEnabled = !!owner && !!spender
  const {
    data: rawAmount,
    isFetching,
    refetch: refetchAllowance,
  } = useReadContract({
    address: assume0xAddress(token?.address),
    chainId: token?.chainId,
    abi: erc20Abi,
    functionName: 'allowance',
    args: queryEnabled ? [assume0xAddress(owner), assume0xAddress(spender)] : undefined,
    query: { enabled: queryEnabled },
  })

  // Refetch when any approval transactions confirm
  useTriggerOnTransactionType(TransactionType.Approve, refetchAllowance)

  const allowance = useMemo(
    () => (token && rawAmount !== undefined ? CurrencyAmount.fromRawAmount(token, rawAmount.toString()) : undefined),
    [token, rawAmount],
  )

  return useMemo(() => ({ tokenAllowance: allowance, isSyncing: isFetching }), [allowance, isFetching])
}

export function useUpdateTokenAllowance(
  amount: CurrencyAmount<Token> | undefined,
  spender: string,
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const analyticsTrace = useTrace()

  const contract = useTokenContract({
    tokenAddress: amount?.currency.address,
    withSignerIfPossible: true,
    chainId: amount?.currency.chainId,
  })
  const contractRef = useRef(contract)
  contractRef.current = contract

  return useCallback(async () => {
    try {
      const contract = contractRef.current
      if (!amount) {
        throw new Error('missing amount')
      }
      if (!contract) {
        throw new Error('missing contract')
      }
      if (!spender) {
        throw new Error('missing spender')
      }

      const allowance = amount.equalTo(0) ? '0' : MAX_ALLOWANCE
      const response = await (async () => {
        const contract = contractRef.current
        try {
          if (!contract) {
            throw new Error('missing contract')
          }
          return await contract.approve(spender, allowance)
        } catch (error) {
          if (didUserReject(error)) {
            const symbol = amount.currency.symbol ?? 'Token'
            throw new UserRejectedRequestError(`${symbol} token allowance failed: User rejected`)
          } else {
            throw error
          }
        }
      })()
      sendAnalyticsEvent(InterfaceEventName.ApproveTokenTxnSubmitted, {
        chain_id: amount.currency.chainId,
        token_symbol: amount.currency.symbol,
        token_address: amount.currency.address,
        ...analyticsTrace,
      })
      return {
        response,
        info: {
          type: TransactionType.Approve,
          tokenAddress: contract.address,
          spender,
          amount: allowance,
        },
      }
    } catch (error: unknown) {
      if (error instanceof UserRejectedRequestError) {
        throw error
      } else {
        const symbol = amount?.currency.symbol ?? 'Token'
        throw new Error(`${symbol} token allowance failed: ${error instanceof Error ? error.message : error}`)
      }
    }
  }, [amount, spender, analyticsTrace])
}

export function useRevokeTokenAllowance(
  token: Token | undefined,
  spender: string,
): () => Promise<{ response: ContractTransaction; info: ApproveTransactionInfo }> {
  const amount = useMemo(() => (token ? CurrencyAmount.fromRawAmount(token, 0) : undefined), [token])

  return useUpdateTokenAllowance(amount, spender)
}
