import { currencyEquals, Token, JSBI } from '@fuseio/fuse-swap-sdk'
import { usePegSwapContract } from './useContract'
import { FUSE_FUSD, FUSE_USDC } from '../constants'
import { useMemo } from 'react'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { useActiveWeb3React } from '.'
import { tryParseAmount } from '../state/swap/hooks'
import { useTransactionAdder } from '../state/transactions/hooks'
import { useSingleCallResult } from '../state/multicall/hooks'

export enum PegSwapType {
  NOT_APPLICABLE = 'NOT_APPLICABLE',
  SWAP = 'SWAP'
}

const NOT_APPLICABLE = { pegSwapType: PegSwapType.NOT_APPLICABLE }

function usePegLiquidity(inputCurrency?: Token, outputCurrency?: Token) {
  const contract = usePegSwapContract()

  const inputs = useMemo(() => [inputCurrency?.address, outputCurrency?.address], [inputCurrency, outputCurrency])
  const liquidity = useSingleCallResult(contract, 'getSwappableAmount', inputs)?.result?.[0]

  return liquidity
}

export default function usePegSwapCallback(
  inputCurrency: Token | undefined,
  outputCurrency: Token | undefined,
  typedValue: string | undefined
): { pegSwapType: PegSwapType; execute?: undefined | (() => Promise<void>); inputError?: string } {
  const { account } = useActiveWeb3React()
  const pegSwapContract = usePegSwapContract()
  const balance = useCurrencyBalance(account ?? undefined, inputCurrency)
  // A 18 decimals -> 0.6
  // B 6 decimals -> 0.6

  // L 6 decimals -> 10,000,000
  const inputAmount = useMemo(() => tryParseAmount(typedValue, outputCurrency), [outputCurrency, typedValue])
  const liquidity = usePegLiquidity(inputCurrency, outputCurrency)
  const addTransaction = useTransactionAdder()

  return useMemo(() => {
    if (!inputCurrency || !outputCurrency || !pegSwapContract) return NOT_APPLICABLE

    if (
      (currencyEquals(inputCurrency, FUSE_FUSD) && currencyEquals(outputCurrency, FUSE_USDC)) ||
      (currencyEquals(inputCurrency, FUSE_USDC) && currencyEquals(outputCurrency, FUSE_FUSD))
    ) {
      console.log(liquidity && JSBI.BigInt(liquidity).toString())
      const sufficientBalance = inputAmount && balance && !balance.lessThan(inputAmount)
      const sufficientLiquidity = inputAmount?.lessThan(JSBI.BigInt(liquidity ?? 0))

      console.log(liquidity && JSBI.BigInt(liquidity).toString(), inputAmount?.raw.toString())

      return {
        pegSwapType: PegSwapType.SWAP,
        execute: async () => {
          console.log(inputAmount?.raw.toString())
          try {
            const txReceipt = await pegSwapContract.swap(
              inputAmount?.raw.toString(),
              inputCurrency.address,
              outputCurrency.address
            )

            addTransaction(txReceipt, {
              summary: `Swap ${inputAmount?.toSignificant(6)} ${inputCurrency.symbol} to ${outputCurrency.symbol}`
            })
          } catch (error) {
            console.error('Could not peg swap', error)
          }
        },
        inputError: sufficientBalance
          ? sufficientLiquidity
            ? undefined
            : 'Insufficient Liquidity'
          : `Insufficient ${inputCurrency.symbol} balance`
      }
    } else {
      return NOT_APPLICABLE
    }
  }, [addTransaction, balance, inputAmount, inputCurrency, liquidity, outputCurrency, pegSwapContract])
}
