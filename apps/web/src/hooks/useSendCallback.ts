import type { TransactionRequest } from '@ethersproject/abstract-provider'
import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useAccount } from 'hooks/useAccount'
import { useEthersProvider } from 'hooks/useEthersProvider'
import useSelectChain from 'hooks/useSelectChain'
import type { GasFeeResult } from 'hooks/useTransactionGasFee'
import { useCallback, useRef } from 'react'
import { useTransactionAdder } from 'state/transactions/hooks'
import { AssetType } from 'uniswap/src/entities/assets'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { SendTokenTransactionInfo } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { currencyAddress, currencyId } from 'uniswap/src/utils/currencyId'
import { toReadableError, UserRejectedRequestError } from 'utils/errors'
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
  const selectChain = useSelectChain()
  const supportedTransactionChainId = useSupportedChainId(transactionRequest?.chainId)

  return useCallback(async () => {
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

    // TODO(WEB-7953): Implement Solana send
    if (isSVMChain(supportedTransactionChainId)) {
      throw new Error('Solana send is not supported')
    }

    try {
      const response = await (async () => {
        try {
          const account = accountRef.current
          let provider = providerRef.current
          if (account.status !== 'connected') {
            throw new Error('wallet must be connected to send')
          }
          if (account.chainId !== supportedTransactionChainId) {
            const success = await selectChain(supportedTransactionChainId)
            if (!success) {
              throw new Error('Failed to switch chain')
            }
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
            throw new UserRejectedRequestError(`Transfer failed: User rejected signature`)
          } else {
            throw error
          }
        }
      })()
      const sendInfo: SendTokenTransactionInfo = {
        type: TransactionType.Send,
        tokenAddress: currencyAddress(currencyAmount.currency),
        assetType: AssetType.Currency,
        currencyAmountRaw: currencyAmount.quotient.toString(),
        recipient,
      }
      addTransaction(response, sendInfo)
      sendAnalyticsEvent(InterfaceEventName.SendInitiated, {
        currencyId: currencyId(currencyAmount.currency),
        amount: sendInfo.currencyAmountRaw ?? '',
        recipient: sendInfo.recipient,
      })
    } catch (error) {
      if (error instanceof UserRejectedRequestError) {
        throw error
      } else {
        throw toReadableError(`Transfer failed:`, error)
      }
    }
  }, [
    addTransaction,
    currencyAmount,
    gasFee?.params,
    recipient,
    supportedTransactionChainId,
    selectChain,
    transactionRequest,
  ])
}
