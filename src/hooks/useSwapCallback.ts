import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { JSBI, TokenAmount, Trade } from '@uniswap/sdk'
import { useMemo } from 'react'
import { INITIAL_ALLOWED_SLIPPAGE } from '../constants'
import { getTradeVersion } from '../data/V1'
import { useTransactionAdder } from '../state/transactions/hooks'
import { calculateGasMargin, getMooniswapContract, getOneSplit, isUseOneSplitContract } from '../utils'
import { useActiveWeb3React } from './index'
import { Version } from './useToggledVersion'
import {
  FLAG_DISABLE_ALL_SPLIT_SOURCES,
  FLAG_DISABLE_ALL_WRAP_SOURCES,
  FLAG_DISABLE_MOONISWAP_ALL
} from '../constants/one-split'

// function isZero(hexNumber: string) {
//   return /^0x0*$/.test(hexNumber)
// }

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
export function useSwapCallback(
  fromAmount: TokenAmount | undefined,
  trade: Trade | undefined, // trade to execute, required
  distribution: BigNumber[] | undefined,
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE // in bips
): null | (() => Promise<string>) {
  const { account, chainId, library } = useActiveWeb3React()
  const addTransaction = useTransactionAdder()

  const isOneSplit = isUseOneSplitContract(distribution);

  const recipient = account

  const tradeVersion = getTradeVersion(trade)
  // const v1Exchange = useV1ExchangeContract(useV1TradeExchangeAddress(trade), true)

  return useMemo(() => {
    if (!trade || !recipient || !library || !account || !tradeVersion || !chainId || !distribution || !fromAmount) return null

    return async function onSwap() {
      const contract: Contract | null = isOneSplit
        ? getOneSplit(chainId, library, account)
        : getMooniswapContract(chainId, library, trade.route.pairs[0].poolAddress, account)
      if (!contract) {
        throw new Error('Failed to get a swap contract')
      }

      const args: any[] = []
      if (isOneSplit) {
        args.push(...[
          trade.inputAmount.token.address,
          trade.outputAmount.token.address,
          fromAmount?.raw.toString(),
          fromAmount.multiply(String(10000 - allowedSlippage)).divide(String(10000)).toFixed(0),
          distribution.map(x => x.toString()),
          JSBI.add(FLAG_DISABLE_ALL_WRAP_SOURCES, JSBI.add(FLAG_DISABLE_ALL_SPLIT_SOURCES, FLAG_DISABLE_MOONISWAP_ALL)).toString()
        ])
      } else {
        const minReturn = BigNumber.from(trade.outputAmount.raw.toString())
          .mul(String(10000 - allowedSlippage)).div(String(10000))

        args.push(...[
          trade.inputAmount.token.address,
          trade.outputAmount.token.address,
          fromAmount?.raw.toString(),
          minReturn.toString(),
          '0x68a17B587CAF4f9329f0e372e3A78D23A46De6b5'
        ])
      }

      let value: BigNumber | undefined
      if (trade.inputAmount.token.symbol === 'ETH') {
          value = BigNumber.from(fromAmount.raw.toString())
      }

      const safeGasEstimate = contract.estimateGas['swap'](...args, value && !value.isZero() ? { value } : {})
        .then(calculateGasMargin)
        .catch(error => {
          console.error(`estimateGas failed for ${ 'swap' }`, error)
          return undefined
        })

      if (BigNumber.isBigNumber(safeGasEstimate) && !BigNumber.isBigNumber(safeGasEstimate)) {
        throw new Error(
          'An error occurred. Please try raising your slippage. If that does not work, contact support.'
        )
      }

      return contract['swap'](...args, {
        gasLimit: safeGasEstimate,
        ...(value && !value.isZero() ? { value } : {})
      })
        .then((response: any) => {
          const inputSymbol = trade.inputAmount.token.symbol
          const outputSymbol = trade.outputAmount.token.symbol
          const inputAmount = trade.inputAmount.toSignificant(3)
          const outputAmount = trade.outputAmount.toSignificant(3)

          const base = `Swap ${ inputAmount } ${ inputSymbol } for ${ outputAmount } ${ outputSymbol }`
          const withRecipient = base

          const withVersion =
            tradeVersion === Version.v2 ? withRecipient : `${ withRecipient } on ${ (tradeVersion as any).toUpperCase() }`

          addTransaction(response, {
            summary: withVersion
          })

          return response.hash
        })
        .catch((error: any) => {
          // if the user rejected the tx, pass this along
          if (error?.code === 4001) {
            throw error
          }
          // otherwise, the error was unexpected and we need to convey that
          else {
            console.error(`Swap failed`, error, 'swap', args, value)
            throw Error('An error occurred while swapping. Please contact support.')
          }
        })
    }
  }, [
    trade,
    recipient,
    library,
    account,
    tradeVersion,
    chainId,
    allowedSlippage,
    addTransaction,
    distribution,
    fromAmount,
    isOneSplit
  ])
}
