import { TransactionRequest } from '@ethersproject/abstract-provider'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { GasFeeResult } from 'hooks/useTransactionGasFee'
import { useCallback } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { SendTransactionInfo, TransactionType } from 'state/transactions/types'
import { trace } from 'tracing/trace'
import { currencyId } from 'utils/currencyId'
import { UserRejectedRequestError, toReadableError } from 'utils/errors'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'
import { useAccount } from 'wagmi'

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
  const signer = useEthersSigner({ chainId: account.chainId })
  const addTransaction = useTransactionAdder()

  return useCallback(
    () =>
      trace({ name: 'Send', op: 'send' }, async (trace) => {
        if (account.status !== 'connected') throw new Error('wallet must be connected to send')
        if (!signer) throw new Error('missing signer')
        if (!transactionRequest) throw new Error('missing to transaction to execute')
        if (!currencyAmount) throw new Error('missing currency amount to send')
        if (!recipient) throw new Error('missing recipient')

        try {
          const response = await trace.child(
            { name: 'Send transaction', op: 'wallet.send_transaction' },
            async (walletTrace) => {
              try {
                return await signer.sendTransaction({
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
    [account.status, signer, transactionRequest, currencyAmount, recipient, addTransaction, gasFee?.params]
  )
}
