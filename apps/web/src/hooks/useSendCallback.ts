import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useCallback } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { SendTransactionInfo, TransactionType } from 'state/transactions/types'
import { trace } from 'tracing/trace'
import { currencyId } from 'utils/currencyId'
import { UserRejectedRequestError, toReadableError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

export function useSendCallback({
  currencyAmount,
  recipient,
  transactionRequest,
}: {
  currencyAmount?: CurrencyAmount<Currency>
  recipient?: string
  transactionRequest?: TransactionRequest
}) {
  const { account, chainId, provider } = useWeb3React()
  const addTransaction = useTransactionAdder()

  return useCallback(
    () =>
      trace({ name: 'Send', op: 'send' }, async (trace) => {
        if (!account || !chainId) throw new Error('wallet must be connect to send')
        if (!provider) throw new Error('missing provider')
        if (!transactionRequest) throw new Error('missing to transaction to execute')
        if (!currencyAmount) throw new Error('missing currency amount to send')
        if (!recipient) throw new Error('missing recipient')

        try {
          const response = await trace.child(
            { name: 'Send transaction', op: 'wallet.send_transaction' },
            async (walletTrace) => {
              try {
                return await provider.getSigner().sendTransaction(transactionRequest)
              } catch (error) {
                if (didUserReject(error)) {
                  walletTrace.setStatus('cancelled')
                  throw new UserRejectedRequestError(`Transfer failed: User rejected signature`)
                } else {
                  throw error
                }
              }
            }
          )
          const sendInfo: SendTransactionInfo = {
            type: TransactionType.SEND,
            currencyId: currencyId(currencyAmount.currency),
            amount: currencyAmount.quotient.toString(),
            recipient,
          }
          addTransaction(response, sendInfo)
        } catch (error) {
          if (error instanceof UserRejectedRequestError) {
            trace.setStatus('cancelled')
            throw error
          } else {
            throw toReadableError(`Transfer failed:`, error)
          }
        }
      }),
    [account, addTransaction, chainId, currencyAmount, provider, recipient, transactionRequest]
  )
}
