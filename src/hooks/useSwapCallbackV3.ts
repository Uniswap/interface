import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { useCallback } from 'react'

import { useSwapFormContext } from 'components/SwapForm/SwapFormContext'
import { ZERO_ADDRESS_SOLANA } from 'constants/index'
import { useActiveWeb3React, useWeb3React } from 'hooks/index'
import useENS from 'hooks/useENS'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE, TransactionExtraInfo2Token } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { isAddress, shortenAddress } from 'utils'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'
import { sendEVMTransaction } from 'utils/sendTransaction'

export interface FeeConfig {
  chargeFeeBy: 'currency_in' | 'currency_out'
  feeReceiver: string
  isInBps: boolean
  feeAmount: string
}

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
const useSwapCallbackV3 = () => {
  const { account, chainId, isEVM } = useActiveWeb3React()
  const { library } = useWeb3React()

  const { typedValue, feeConfig, isSaveGas, recipient: recipientAddressOrName, routeSummary } = useSwapFormContext()
  const { parsedAmountIn: inputAmount, parsedAmountOut: outputAmount, priceImpact } = routeSummary || {}

  const [allowedSlippage] = useUserSlippageTolerance()

  const addTransactionWithType = useTransactionAdder()

  const { address: recipientAddress } = useENS(recipientAddressOrName)

  const recipient = recipientAddressOrName === null || recipientAddressOrName === '' ? account : recipientAddress

  const getSwapData = useCallback(() => {
    if (!inputAmount || !outputAmount) {
      throw new Error('"inputAmount" is undefined.')
    }

    const inputSymbol = inputAmount.currency.symbol
    const outputSymbol = outputAmount.currency.symbol
    const inputAddress = inputAmount.currency.isNative ? ZERO_ADDRESS_SOLANA : inputAmount.currency.address
    const outputAddress = outputAmount.currency.isNative ? ZERO_ADDRESS_SOLANA : outputAmount.currency.address
    const inputAmountStr = formatCurrencyAmount(inputAmount, 6)
    const outputAmountStr = formatCurrencyAmount(outputAmount, 6)

    const inputAmountFormat =
      feeConfig && feeConfig.chargeFeeBy === 'currency_in' && feeConfig.isInBps ? typedValue : inputAmountStr

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
        tokenAmountOut: outputAmountStr,
        tokenSymbolIn: inputSymbol,
        tokenSymbolOut: outputSymbol,
        tokenAddressIn: inputAddress,
        tokenAddressOut: outputAddress,
        arbitrary: {
          inputSymbol,
          outputSymbol,
          inputAddress,
          outputAddress,
          inputDecimals: inputAmount.currency.decimals,
          outputDecimals: outputAmount.currency.decimals,
          withRecipient,
          saveGas: isSaveGas,
          inputAmount: inputAmount.toExact(),
          slippageSetting: allowedSlippage ? allowedSlippage / 100 : 0,
          priceImpact: priceImpact && priceImpact > 0.01 ? priceImpact.toFixed(2) : '<0.01',
        },
      } as TransactionExtraInfo2Token,
    }
  }, [
    account,
    allowedSlippage,
    chainId,
    feeConfig,
    inputAmount,
    isSaveGas,
    outputAmount,
    priceImpact,
    recipient,
    recipientAddressOrName,
    typedValue,
  ])

  const handleSwapResponse = useCallback(
    (tx: TransactionResponse) => {
      const swapData = getSwapData()

      addTransactionWithType({
        ...swapData,
        hash: tx.hash,
      })
    },
    [addTransactionWithType, getSwapData],
  )

  const swapCallbackForEVM = useCallback(
    async (routerAddress: string | undefined, encodedSwapData: string | undefined) => {
      if (!account || !inputAmount || !routerAddress || !encodedSwapData) {
        throw new Error('Missing dependencies')
      }

      const value = BigNumber.from(inputAmount.currency.isNative ? inputAmount.quotient.toString() : 0)
      const response = await sendEVMTransaction(
        account,
        library,
        routerAddress,
        encodedSwapData,
        value,
        handleSwapResponse,
      )
      if (response?.hash === undefined) throw new Error('sendTransaction returned undefined.')
      return response?.hash
    },
    [account, handleSwapResponse, inputAmount, library],
  )

  if (isEVM) {
    return swapCallbackForEVM
  }

  return null
}

export default useSwapCallbackV3
