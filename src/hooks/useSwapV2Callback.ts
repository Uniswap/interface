import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { SignerWalletAdapter } from '@solana/wallet-adapter-base'
import { useCallback, useMemo } from 'react'

import { ZERO_ADDRESS_SOLANA } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks/index'
import useENS from 'hooks/useENS'
import { useEncodeSolana, useSwapState } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfo2Token } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isAddress, shortenAddress } from 'utils'
import { Aggregator } from 'utils/aggregator'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { sendEVMTransaction, sendSolanaTransactions } from 'utils/sendTransaction'

import useProvider from './solana/useProvider'

enum SwapCallbackState {
  INVALID,
  LOADING,
  VALID,
}

export interface FeeConfig {
  chargeFeeBy: 'currency_in' | 'currency_out'
  feeReceiver: string
  isInBps: boolean
  feeAmount: string
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapV2Callback(
  trade: Aggregator | undefined, // trade to execute, required
): { state: SwapCallbackState; callback: null | (() => Promise<string>); error: string | null } {
  const { account, chainId, isEVM, isSolana, walletSolana } = useActiveWeb3React()
  const { library } = useWeb3React()
  const provider = useProvider()
  const [encodeSolana] = useEncodeSolana()

  const { typedValue, feeConfig, saveGas, recipient: recipientAddressOrName } = useSwapState()

  const [allowedSlippage] = useUserSlippageTolerance()

  const addTransactionWithType = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)

  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress

  const extractSwapData = useCallback(() => {
    if (!trade) {
      throw new Error('"trade" is undefined.')
    }

    const inputSymbol = trade.inputAmount.currency.symbol
    const outputSymbol = trade.outputAmount.currency.symbol
    const inputAddress = trade.inputAmount.currency.isNative ? ZERO_ADDRESS_SOLANA : trade.inputAmount.currency.address
    const outputAddress = trade.outputAmount.currency.isNative
      ? ZERO_ADDRESS_SOLANA
      : trade.outputAmount.currency.address
    const inputAmount = formatCurrencyAmount(trade.inputAmount, 6)
    const outputAmount = formatCurrencyAmount(trade.outputAmount, 6)

    const inputAmountFormat =
      feeConfig && feeConfig.chargeFeeBy === 'currency_in' && feeConfig.isInBps ? typedValue : inputAmount

    const withRecipient =
      recipient === account
        ? undefined
        : `to ${
            recipientAddressOrName && isAddress(chainId, recipientAddressOrName)
              ? shortenAddress(chainId, recipientAddressOrName)
              : recipientAddressOrName
          }`

    return {
      hash: '',
      type: TRANSACTION_TYPE.SWAP,
      extraInfo: {
        tokenAmountIn: inputAmountFormat,
        tokenAmountOut: outputAmount,
        tokenSymbolIn: inputSymbol,
        tokenSymbolOut: outputSymbol,
        tokenAddressIn: inputAddress,
        tokenAddressOut: outputAddress,
        arbitrary: {
          inputSymbol,
          outputSymbol,
          inputAddress,
          outputAddress,
          inputDecimals: trade.inputAmount.currency.decimals,
          outputDecimals: trade.outputAmount.currency.decimals,
          withRecipient,
          saveGas,
          inputAmount: trade.inputAmount.toExact(),
          slippageSetting: allowedSlippage ? allowedSlippage / 100 : 0,
          priceImpact: trade && trade?.priceImpact > 0.01 ? trade?.priceImpact.toFixed(2) : '<0.01',
        },
      } as TransactionExtraInfo2Token,
    }
  }, [account, allowedSlippage, chainId, feeConfig, recipient, recipientAddressOrName, saveGas, trade, typedValue])

  return useMemo(() => {
    if (!trade || !account) {
      return { state: SwapCallbackState.INVALID, callback: null, error: 'Missing dependencies' }
    }
    const swapData = extractSwapData()
    const onHandleSwapResponse = (tx: TransactionResponse) => {
      addTransactionWithType({
        ...swapData,
        hash: tx.hash,
      })
    }

    if (!recipient) {
      if (recipientAddressOrName !== null) {
        return { state: SwapCallbackState.INVALID, callback: null, error: 'Invalid recipient' }
      } else {
        return { state: SwapCallbackState.LOADING, callback: null, error: null }
      }
    }

    const value = BigNumber.from(trade.inputAmount.currency.isNative ? trade.inputAmount.quotient.toString() : 0)
    const onSwapWithBackendEncode = async (): Promise<string> => {
      const response = await sendEVMTransaction(
        account,
        library,
        trade.routerAddress,
        trade.encodedSwapData,
        value,
        onHandleSwapResponse,
        chainId,
      )
      if (response?.hash === undefined) throw new Error('sendTransaction returned undefined.')
      return response?.hash
    }
    const onSwapSolana = async (): Promise<string> => {
      if (!provider) throw new Error('Please connect wallet first')
      if (!walletSolana.wallet?.adapter) throw new Error('Please connect wallet first')
      if (!encodeSolana) throw new Error('Encode not found')

      const hash = await sendSolanaTransactions(
        encodeSolana,
        walletSolana.wallet.adapter as any as SignerWalletAdapter,
        addTransactionWithType,
        swapData,
      )
      if (hash === undefined) throw new Error('sendTransaction returned undefined.')
      return hash[0]
    }

    return {
      state: SwapCallbackState.VALID,
      callback: isEVM ? onSwapWithBackendEncode : isSolana ? (encodeSolana ? onSwapSolana : null) : null,
      error: null,
    }
  }, [
    chainId,
    trade,
    encodeSolana,
    account,
    recipient,
    isEVM,
    isSolana,
    recipientAddressOrName,
    library,
    provider,
    walletSolana,
    addTransactionWithType,
    extractSwapData,
  ])
}
