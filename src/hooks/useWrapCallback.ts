import { Currency, WETH } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { PublicKey, Transaction } from '@solana/web3.js'
import { useMemo } from 'react'

import { NativeCurrencies } from 'constants/tokens'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useCurrencyBalance } from 'state/wallet/hooks'
import { calculateGasMargin } from 'utils'
import { checkAndCreateUnwrapSOLInstruction, createWrapSOLInstructions } from 'utils/solanaInstructions'

import { useActiveWeb3React, useWeb3Solana } from './index'
import useProvider from './solana/useProvider'
import { useWETHContract } from './useContract'

export enum WrapType {
  NOT_APPLICABLE,
  WRAP,
  UNWRAP,
}

const NOT_APPLICABLE = { wrapType: WrapType.NOT_APPLICABLE }
/**
 * Given the selected input and output currency, return a wrap callback
 * @param inputCurrency the selected input currency
 * @param outputCurrency the selected output currency
 * @param typedValue the user input value
 */
export default function useWrapCallback(
  inputCurrency: Currency | undefined | null,
  outputCurrency: Currency | undefined | null,
  typedValue: string | undefined,
  forceWrap = false,
): {
  wrapType: WrapType
  execute?: undefined | (() => Promise<string | undefined>)
  inputError?: string
  allowUnwrap?: boolean
} {
  const { chainId, isEVM, isSolana, account } = useActiveWeb3React()
  const provider = useProvider()
  const wethContract = useWETHContract()
  const balance = useCurrencyBalance(inputCurrency ?? undefined)
  // we can always parse the amount typed as the input currency, since wrapping is 1:1
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency ?? undefined), [inputCurrency, typedValue])
  const addTransactionWithType = useTransactionAdder()
  const { connection } = useWeb3Solana()

  return useMemo(() => {
    if ((!wethContract && isEVM) || !inputCurrency || !outputCurrency) return NOT_APPLICABLE

    const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)

    const nativeTokenSymbol = NativeCurrencies[chainId].symbol

    if ((inputCurrency.isNative && WETH[chainId].equals(outputCurrency)) || (forceWrap && inputCurrency.isNative)) {
      return {
        wrapType: WrapType.WRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  let hash: string | undefined
                  if (isEVM && wethContract) {
                    const estimateGas = await wethContract.estimateGas.deposit({
                      value: `0x${inputAmount.quotient.toString(16)}`,
                    })
                    const txReceipt = await wethContract.deposit({
                      value: `0x${inputAmount.quotient.toString(16)}`,
                      gasLimit: calculateGasMargin(estimateGas),
                    })
                    hash = txReceipt?.hash
                  } else if (isSolana && account && provider && connection) {
                    const accountPK = new PublicKey(account)
                    const wrapIxs = await createWrapSOLInstructions(connection, accountPK, inputAmount)
                    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

                    const tx = new Transaction({
                      blockhash,
                      lastValidBlockHeight,
                      feePayer: accountPK,
                    })
                    tx.add(...wrapIxs)
                    hash = await provider.sendAndConfirm(tx)
                  }
                  if (hash) {
                    const tokenAmount = inputAmount.toSignificant(6)
                    addTransactionWithType({
                      hash,
                      type: TRANSACTION_TYPE.WRAP_TOKEN,
                      extraInfo: {
                        tokenAmountIn: tokenAmount,
                        tokenAmountOut: tokenAmount,
                        tokenSymbolIn: nativeTokenSymbol ?? '',
                        tokenSymbolOut: WETH[chainId].symbol ?? '',
                        tokenAddressIn: WETH[chainId].address,
                        tokenAddressOut: WETH[chainId].address,
                      },
                    })
                    return hash
                  }
                  throw new Error()
                } catch (error) {
                  console.error('Could not deposit', error)
                  return
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient ${NativeCurrencies[chainId].symbol} balance`,
      }
    }
    if (WETH[chainId].equals(inputCurrency) && outputCurrency.isNative) {
      return {
        wrapType: WrapType.UNWRAP,
        execute:
          sufficientBalance && inputAmount
            ? async () => {
                try {
                  let hash: string | undefined
                  if (isEVM && wethContract) {
                    const estimateGas = await wethContract.estimateGas.withdraw(
                      `0x${inputAmount.quotient.toString(16)}`,
                    )
                    const txReceipt = await wethContract.withdraw(`0x${inputAmount.quotient.toString(16)}`, {
                      gasLimit: calculateGasMargin(estimateGas),
                    })
                    hash = txReceipt.hash
                  } else if (isSolana && account && provider && connection) {
                    const accountPK = new PublicKey(account)
                    const ix = await checkAndCreateUnwrapSOLInstruction(connection, accountPK)
                    if (ix) {
                      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash()

                      const tx = new Transaction({
                        blockhash,
                        lastValidBlockHeight,
                        feePayer: accountPK,
                      })
                      tx.add(ix)
                      hash = await provider.sendAndConfirm(tx)
                    }
                  }
                  if (hash) {
                    const tokenAmount = inputAmount.toSignificant(6)
                    addTransactionWithType({
                      hash,
                      type: TRANSACTION_TYPE.UNWRAP_TOKEN,
                      extraInfo: {
                        tokenAmountIn: tokenAmount,
                        tokenAmountOut: tokenAmount,
                        tokenSymbolIn: WETH[chainId].symbol ?? '',
                        tokenSymbolOut: nativeTokenSymbol ?? '',
                        tokenAddressIn: WETH[chainId].address,
                        tokenAddressOut: WETH[chainId].address,
                      },
                    })
                    return hash
                  }
                  throw new Error()
                } catch (error) {
                  console.error('Could not withdraw', error)
                  return
                }
              }
            : undefined,
        inputError: !typedValue
          ? t`Enter an amount`
          : sufficientBalance
          ? undefined
          : t`Insufficient W${NativeCurrencies[chainId].symbol} balance`,
      }
    }
    return NOT_APPLICABLE
  }, [
    wethContract,
    isEVM,
    chainId,
    inputCurrency,
    outputCurrency,
    inputAmount,
    balance,
    typedValue,
    isSolana,
    account,
    provider,
    addTransactionWithType,
    forceWrap,
    connection,
  ])
}
