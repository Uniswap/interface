import { useEffect, useMemo, useState } from 'react'
import { useActiveWeb3React } from 'hooks/web3'
import { Router, Trade as V2Trade } from '@uniswap/v2-sdk'
import { FeeAmount, Pool, Trade as V3Trade } from '@uniswap/v3-sdk'
import { Currency, CurrencyAmount, Percent, TradeType } from '@uniswap/sdk-core'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import useTransactionDeadline from './useTransactionDeadline'
import { useV2RouterContract } from './useContract'
import { usePools } from './usePools'
import { WETH9_EXTENDED } from 'constants/tokens'
import isZero from 'utils/isZero'
import { useGasEstimateForApproval } from './useApproveCallback'

/**
 * Computes a gas adjusted quote from a V2 trade, considering both swap gas cost and approval cost.
 * Takes a gas adjusted V3 quote and further adjusts it considering approval cost.
 * Compares the 2 trades, and returns true if the V3 trade is better.
 *
 * This is a temporary solution while the smart order router does not consider V2 routes.
 *
 * @param v2Trade The V2 trade to compare against.
 * @param v3TradeGasAdjusted The V3 trade where the quote amount is a gas adjusted value.
 * @param gasPrice The gas price to use for computing gas adjusted quotes.
 * @returns True if the V3 trade is better. False otherwise.
 */
export function useBetterTrade(
  v2Trade: V2Trade<Currency, Currency, TradeType>,
  v3TradeGasAdjusted: V3Trade<Currency, Currency, TradeType>,
  gasPrice: BigNumber
): boolean | undefined {
  const { chainId, library, account } = useActiveWeb3React()
  const deadline = useTransactionDeadline()
  const routerContract = useV2RouterContract()

  const [v2TradeApprovalGasEstimate] = useGasEstimateForApproval(v2Trade.inputAmount, account ?? undefined)
  const [v3TradeApprovalGasEstimate] = useGasEstimateForApproval(v2Trade.inputAmount, account ?? undefined)

  const [v2SwapGasEstimate, setV2SwapGasEstimate] = useState<BigNumber | undefined>()

  const tradeType = v2Trade.tradeType
  const quoteToken = tradeType == TradeType.EXACT_INPUT ? v2Trade.outputAmount.currency : v2Trade.inputAmount.currency
  const weth = chainId ? WETH9_EXTENDED[chainId] : undefined

  const pools = usePools([
    [quoteToken, weth, FeeAmount.HIGH],
    [quoteToken, weth, FeeAmount.MEDIUM],
    [quoteToken, weth, FeeAmount.LOW],
  ])

  useEffect(() => {
    if (!library || !routerContract) return

    const sampleSlippage = new Percent(5, 100)
    const sampleRecipient = '0x0'
    const sampleDeadline = deadline?.toNumber() ?? 60

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

    library.estimateGas(tx).then((gasEstimate) => setV2SwapGasEstimate(gasEstimate))
  }, [deadline, library, routerContract, v2Trade])

  return useMemo(() => {
    if (!v2Trade || !weth || !v2SwapGasEstimate || !v2TradeApprovalGasEstimate || !v3TradeApprovalGasEstimate) {
      return undefined
    }

    const v2GasEstimate = v2SwapGasEstimate.add(v2TradeApprovalGasEstimate)
    console.log(
      { swapGasEstimate: v2SwapGasEstimate.toString(), approvalGasEstimate: v2TradeApprovalGasEstimate.toString() },
      'Got gas estimates for V2 trade'
    )

    let v2TradeAndApprovalGasCostInQuoteToken
    let v3ApprovalGasCostInQuoteToken
    if (weth && (quoteToken.equals(weth) || quoteToken.isNative)) {
      v2TradeAndApprovalGasCostInQuoteToken = CurrencyAmount.fromRawAmount(
        quoteToken,
        v2GasEstimate.mul(gasPrice).toString()
      )
      v3ApprovalGasCostInQuoteToken = CurrencyAmount.fromRawAmount(
        quoteToken,
        v3TradeApprovalGasEstimate.mul(gasPrice).toString()
      )
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
      const v2TradeGasCostInEth = CurrencyAmount.fromRawAmount(weth, v2SwapGasEstimate.mul(gasPrice).toString())
      const v3TradeApprovalCostInEth = CurrencyAmount.fromRawAmount(
        weth,
        v3TradeApprovalGasEstimate.mul(gasPrice).toString()
      )
      v2TradeAndApprovalGasCostInQuoteToken = ethTokenPrice.quote(v2TradeGasCostInEth)
      v3ApprovalGasCostInQuoteToken = ethTokenPrice.quote(v3TradeApprovalCostInEth)
    }

    if (tradeType == TradeType.EXACT_INPUT) {
      const v3QuoteGasAdjusted = v3TradeGasAdjusted.outputAmount.subtract(v3ApprovalGasCostInQuoteToken)
      const v2QuoteGasAdjusted = v2Trade.outputAmount.subtract(v2TradeAndApprovalGasCostInQuoteToken)
      return v3QuoteGasAdjusted.greaterThan(v2QuoteGasAdjusted)
    } else {
      const v3QuoteGasAdjusted = v3TradeGasAdjusted.inputAmount.add(v3ApprovalGasCostInQuoteToken)
      const v2QuoteGasAdjusted = v2Trade.inputAmount.add(v2TradeAndApprovalGasCostInQuoteToken)
      return v2QuoteGasAdjusted.greaterThan(v3QuoteGasAdjusted)
    }
  }, [
    gasPrice,
    pools,
    quoteToken,
    tradeType,
    v2SwapGasEstimate,
    v2Trade,
    v2TradeApprovalGasEstimate,
    v3TradeApprovalGasEstimate,
    v3TradeGasAdjusted.inputAmount,
    v3TradeGasAdjusted.outputAmount,
    weth,
  ])
}
