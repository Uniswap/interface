import { useActiveWeb3React } from 'hooks/web3'
import { Router, Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeAmount, Pool } from '@uniswap/v3-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import useTransactionDeadline from './useTransactionDeadline'
import { useV2RouterContract } from './useContract'
import { usePools } from './usePools'
import { WETH9_EXTENDED } from 'constants/tokens'
import isZero from 'utils/isZero'

/**
 * Computes a gas adjusted quote from a V2 trade, then compares it to a gas adjusted V3 quote from the smart order router.
 *
 * This is a temporary solution while the smart order router does not consider V2 routes. Long term the smart order router
 * will return the best route considering both V2 and V3.
 *
 * @param v2Trade The V2 trade to compare against.
 * @param tradeType The type of trade.
 * @param gasPrice The gas price to use for computing gas adjusted quotes.
 * @param v3QuoteGasAdjusted The gas adjusted quote returned by the smart order router.
 * @returns True if the V3 trade is better. False otherwise.
 */
export async function useCompareGasAdjustedV2TradeandV3Trade(
  v2Trade: V2Trade<Currency, Currency, TradeType>,
  tradeType: TradeType,
  gasPrice: BigNumber,
  v3QuoteGasAdjusted: CurrencyAmount<Currency>
): Promise<boolean | undefined> {
  const { chainId, library } = useActiveWeb3React()
  const deadline = useTransactionDeadline()
  const routerContract = useV2RouterContract()

  const quoteToken = tradeType == TradeType.EXACT_INPUT ? v2Trade.outputAmount.currency : v2Trade.inputAmount.currency
  const weth = chainId ? WETH9_EXTENDED[chainId] : undefined

  const pools = usePools([
    [quoteToken, weth, FeeAmount.HIGH],
    [quoteToken, weth, FeeAmount.MEDIUM],
    [quoteToken, weth, FeeAmount.LOW],
  ])

  if (!v2Trade || !deadline || !library || !chainId || !routerContract || !weth) {
    return undefined
  }

  const sampleSlippage = new Percent(5, 100)
  const sampleRecipient = '0x0'
  const sampleDeadline = deadline.toNumber()

  const { methodName, args, value } = Router.swapCallParameters(v2Trade, {
    feeOnTransfer: false,
    allowedSlippage: sampleSlippage,
    recipient: sampleRecipient,
    deadline: sampleDeadline,
  })

  const address = routerContract.address
  const calldata = routerContract.interface.encodeFunctionData(methodName, args)

  const tx =
    !value || isZero(value)
      ? { /* from: account,  */ to: address, data: calldata }
      : {
          /* from: account, */
          to: address,
          data: calldata,
          value,
        }

  const gasEstimate = await library.estimateGas(tx)
  console.log({ gasEstimate: gasEstimate.toString() }, 'Got gas estimate for V2 trade')

  let gasCostInTermsOfQuoteToken
  if (weth && (quoteToken.equals(weth) || quoteToken.isNative)) {
    gasCostInTermsOfQuoteToken = CurrencyAmount.fromRawAmount(quoteToken, gasEstimate.mul(gasPrice).toString())
  } else {
    let ethPool: Pool | null = null
    for (const [, pool] of pools) {
      if (!ethPool || (pool && JSBI.greaterThan(pool?.liquidity, ethPool.liquidity))) {
        ethPool = pool
      }
    }

    if (!ethPool) {
      console.debug(
        `Unable to find ${quoteToken.symbol}/WETH pool to compute gas adjusted amount for V2. Assuming V3 trade is better.`
      )
      return true
    }

    const ethToken0 = ethPool.token0.address == weth?.address
    const ethTokenPrice = ethToken0 ? ethPool.token0Price : ethPool.token1Price
    const gasCostInEth = CurrencyAmount.fromRawAmount(weth, gasEstimate.mul(gasPrice).toString())
    gasCostInTermsOfQuoteToken = ethTokenPrice.quote(gasCostInEth)
  }

  if (tradeType == TradeType.EXACT_INPUT) {
    const v2QuoteGasAdjusted = v2Trade.outputAmount.subtract(gasCostInTermsOfQuoteToken)
    return v3QuoteGasAdjusted.greaterThan(v2QuoteGasAdjusted)
  } else {
    const v2QuoteGasAdjusted = v2Trade.inputAmount.add(gasCostInTermsOfQuoteToken)
    return v2QuoteGasAdjusted.greaterThan(v3QuoteGasAdjusted)
  }
}
