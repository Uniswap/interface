import { TransactionRequest } from '@ethersproject/abstract-provider'
import { InterfaceEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { GasFeeResult } from 'hooks/useTransactionGasFee'
import { useCallback, useRef } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { SendTransactionInfo, TransactionType } from 'state/transactions/types'
import { trace } from 'tracing/trace'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { currencyId } from 'utils/currencyId'
import { UserRejectedRequestError, toReadableError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

export function useSendCallback({
  currencyAmount,
  recipient,
  transactionRequest,
  gasFee,
}: {
  currencyAmount?: CurrencyAmount<Currency>
  recipient?: string
  transactionRequest?: TransactionRequest
  gasFee?: GasFeeResult
}) {
  const account = useAccount()
  const accountRef = useRef(account)
  accountRef.current = account
  const provider = useEthersProvider({ chainId: account.chainId })
  const providerRef = useRef(provider)
  providerRef.current = provider

  const addTransaction = useTransactionAdder()
  const switchChain = useSwitchChain()
  const supportedTransactionChainId = useSupportedChainId(transactionRequest?.chainId)

  return useCallback(
    () =>
      trace({ name: 'Send', op: 'send' }, async (trace) => {
        if (!transactionRequest) {
          throw new Error('missing to transaction to execute')
        }
        if (!currencyAmount) {
          throw new Error('missing currency amount to send')
        }
        if (!recipient) {
          throw new Error('missing recipient')
        }
        if (!supportedTransactionChainId) {
          throw new Error('missing chainId in transactionRequest')
        }

        try {
          const response = await trace.child(
            { name: 'Send transaction', op: 'wallet.send_transaction' },
            async (walletTrace) => {
              try {
                const account = accountRef.current
                let provider = providerRef.current
                if (account.status !== 'connected') {
                  throw new Error('wallet must be connected to send')
                }
                if (account.chainId !== supportedTransactionChainId) {
                  await switchChain(supportedTransactionChainId)
                  // We need to reassign the provider after switching chains
                  // otherwise sendTransaction will use the provider that is
                  // not connected to the correct chain
                  provider = providerRef.current
                }
                if (!provider) {
                  throw new Error('missing provider')
                }
                return await provider.getSigner().sendTransaction({
                  ...transactionRequest,
                  ...gasFee?.params,
                })
              } catch (error) {
                if (didUserReject(error)) {
                  walletTrace.setStatus('cancelled')
                  throw new UserRejectedRequestError(`Transfer failed: User rejected signature`)
                } else {
                  throw error
                }
              }
            },
          )
          const sendInfo: SendTransactionInfo = {
            type: TransactionType.SEND,
            currencyId: currencyId(currencyAmount.currency),
            amount: currencyAmount.quotient.toString(),
            recipient,
          }
          addTransaction(response, sendInfo)
          sendAnalyticsEvent(InterfaceEventName.SEND_INITIATED, {
            currencyId: sendInfo.currencyId,
            amount: sendInfo.amount,
            recipient: sendInfo.recipient,
          })
        } catch (error) {
          if (error instanceof UserRejectedRequestError) {
            trace.setStatus('cancelled')
            throw error
          } else {
            throw toReadableError(`Transfer failed:`, error)
          }
        }
      }),
    [
      addTransaction,
      currencyAmount,
      gasFee?.params,
      recipient,
      supportedTransactionChainId,
      switchChain,
      transactionRequest,
    ],
  )
}
