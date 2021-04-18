import { currencyEquals, Token, JSBI } from '@fuseio/fuse-swap-sdk'
import { usePegSwapContract } from './useContract'
import { FUSE_FUSD, FUSE_USDC } from '../constants'
import { useMemo } from 'react'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { useActiveWeb3React } from '.'
import { tryParseAmount } from '../state/swap/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useSingleCallResult } from '../state/multicall/hooks'
import { tryFormatAmount } from '../utils'
import { formatUnits } from 'ethers/lib/utils'

export enum PegSwapType {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  SWAP = 'SWAP'
}

const NOT_APPLICABLE = { pegSwapType: PegSwapType.NOT_APPLICABLE }

function usePegLiquidity(inputCurrency?: Token, outputCurrency?: Token) {
  const contract = usePegSwapContract()

  const inputs = useMemo(() => [inputCurrency?.address, outputCurrency?.address], [inputCurrency, outputCurrency])
  const liquidity = useSingleCallResult(contract, 'getSwappableAmount', inputs)?.result?.[0]

  return tryFormatAmount(liquidity?.toString(), outputCurrency?.decimals)
}

function usePegMinimum(inputCurrency?: Token, outputCurrency?: Token) {
  if (!inputCurrency || !outputCurrency) return

  const inputDecimals = inputCurrency.decimals
  const outputDecimals = outputCurrency.decimals
  const rate = JSBI.BigInt(Math.abs(inputDecimals - outputDecimals))
  const min = String(JSBI.exponentiate(JSBI.BigInt(10), rate))

  if (inputDecimals > outputDecimals) {
    return formatUnits(min, inputDecimals)
  }

  return
}

export default function usePegSwapCallback(
  inputCurrency: Token | undefined,
  outputCurrency: Token | undefined,
  typedValue: string | undefined
): { pegSwapType: PegSwapType; execute?: undefined | (() => Promise<any>); inputError?: string } {
  const { account } = useActiveWeb3React()
  const pegSwapContract = usePegSwapContract()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency)
  const inputAmount = useMemo(() => tryParseAmount(typedValue, inputCurrency), [inputCurrency, typedValue])
  const liquidity = usePegLiquidity(inputCurrency, outputCurrency)
  const minimum = usePegMinimum(inputCurrency, outputCurrency)
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!inputCurrency || !outputCurrency || !pegSwapContract) return NOT_APPLICABLE

    if (
      (currencyEquals(inputCurrency, FUSE_FUSD) && currencyEquals(outputCurrency, FUSE_USDC)) ||
      (currencyEquals(inputCurrency, FUSE_USDC) && currencyEquals(outputCurrency, FUSE_FUSD))
    ) {
      let error
      if (!inputAmount) {
        error = 'Enter an amount'
      } else if (inputAmount && balance && balance.lessThan(inputAmount)) {
        error = `Insufficient ${inputCurrency.symbol} balance`
      } else if (Number(typedValue) > Number(liquidity)) {
        error = `Above maximum limit ${liquidity}`
      } else if (minimum && Number(typedValue) < Number(minimum)) {
        error = `Below minimum limit ${minimum}`
      }

      return {
        pegSwapType: PegSwapType.SWAP,
        execute: async () => {
          try {
            const txReceipt = await pegSwapContract.swap(
              inputAmount?.raw.toString(),
              inputCurrency.address,
              outputCurrency.address
            )

            addTransaction(txReceipt, {
              summary: `Swap ${inputAmount?.toSignificant(6)} ${inputCurrency.symbol} to ${outputCurrency.symbol}`
            })

            return txReceipt
          } catch (error) {
            throw new Error('Could not peg swap ' + error)
          }
        },
        inputError: error
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [
    addTransaction,
    balance,
    inputAmount,
    inputCurrency,
    liquidity,
    minimum,
    outputCurrency,
    pegSwapContract,
    typedValue
  ])
}
