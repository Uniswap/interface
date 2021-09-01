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
 * Return V2 Router swap gas estimate.
 * Not required for V3 as the routing API returns the estimates.
 */
function useV2SwapGasEstimate(trade: V2Trade<Currency, Currency, TradeType>) {
  const { library } = useActiveWeb3React()
  const deadline = useTransactionDeadline()
  const routerContract = useV2RouterContract()

  const [v2SwapGasEstimateWei, setV2SwapGasEstimate] = useState<BigNumber | undefined>()

  useEffect(() => {
    if (!library || !routerContract) return

    const sampleSlippage = new Percent(5, 100)
    const sampleRecipient = '0x0'
    const sampleDeadline = deadline?.toNumber() ?? 60

    const { methodName, args, value } = Router.swapCallParameters(trade, {
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
  }, [deadline, library, routerContract, trade])

  return v2SwapGasEstimateWei
}

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
  v3Trade: V3Trade<Currency, Currency, TradeType>,
  v3SwapGasEstimateWei: BigNumber,
  gasPrice: BigNumber
): boolean | undefined {
  const { chainId, account } = useActiveWeb3React()

  // accounts for trade approval in case either router isn't approved yet
  const [v2TradeApprovalGasEstimateWei] = useGasEstimateForApproval(v2Trade.inputAmount, account ?? undefined)
  const [v3TradeApprovalGasEstimateWei] = useGasEstimateForApproval(v2Trade.inputAmount, account ?? undefined)

  // only estimate V2 swap gas since routing api returns v3 gas estimates
  const v2SwapGasEstimateWei = useV2SwapGasEstimate(v2Trade)

  const tradeType = v2Trade.tradeType
  const quoteToken = tradeType == TradeType.EXACT_INPUT ? v2Trade.outputAmount.currency : v2Trade.inputAmount.currency
  const weth = chainId ? WETH9_EXTENDED[chainId] : undefined

  const pools = usePools([
    [quoteToken, weth, FeeAmount.HIGH],
    [quoteToken, weth, FeeAmount.MEDIUM],
    [quoteToken, weth, FeeAmount.LOW],
  ])

  return useMemo(() => {
    if (
      !v2Trade ||
      !weth ||
      !v2SwapGasEstimateWei ||
      !v2TradeApprovalGasEstimateWei ||
      !v3TradeApprovalGasEstimateWei
    ) {
      return undefined
    }

    const v2GasEstimate = v2SwapGasEstimateWei.add(v2TradeApprovalGasEstimateWei)
    const v3GasEstimate = v3SwapGasEstimateWei.add(v3TradeApprovalGasEstimateWei)

    let v2TradeAndApprovalGasCostInQuoteToken
    let v3TradeAndApprovalGasCostInQuoteToken
    if (weth && (quoteToken.equals(weth) || quoteToken.isNative)) {
      v2TradeAndApprovalGasCostInQuoteToken = CurrencyAmount.fromRawAmount(
        quoteToken,
        v2GasEstimate.mul(gasPrice).toString()
      )
      v3TradeAndApprovalGasCostInQuoteToken = CurrencyAmount.fromRawAmount(
        quoteToken,
        v3GasEstimate.mul(gasPrice).toString()
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
      const v2TradeGasCostInEth = CurrencyAmount.fromRawAmount(weth, v2GasEstimate.mul(gasPrice).toString())
      const v3TradeGasCostInEth = CurrencyAmount.fromRawAmount(weth, v3GasEstimate.mul(gasPrice).toString())
      v2TradeAndApprovalGasCostInQuoteToken = ethTokenPrice.quote(v2TradeGasCostInEth)
      v3TradeAndApprovalGasCostInQuoteToken = ethTokenPrice.quote(v3TradeGasCostInEth)
    }

    if (tradeType == TradeType.EXACT_INPUT) {
      const v3QuoteGasAdjusted = v3Trade.outputAmount.subtract(v3TradeAndApprovalGasCostInQuoteToken)
      const v2QuoteGasAdjusted = v2Trade.outputAmount.subtract(v2TradeAndApprovalGasCostInQuoteToken)
      console.debug(
        {
          v2SwapGasEstimate: v2SwapGasEstimateWei.toString(),
          v2ApprovalGasEstimate: v2TradeApprovalGasEstimateWei.toString(),
          v3SwapGasEstimate: v2GasEstimate.toString(),
          v3ApprovalGasEstimate: v3TradeApprovalGasEstimateWei.toString(),
          v3QuoteGasAdjusted: v3QuoteGasAdjusted.toString(),
          v3Quote: v3Trade.outputAmount.toString(),
          v2QuoteGasAdjusted: v2QuoteGasAdjusted.toString(),
          v2Quote: v2Trade.outputAmount.toString(),
        },
        `Swap and approval estimates ${tradeType.toString()} for V2 vs V3 trade`
      )

      return v3QuoteGasAdjusted.greaterThan(v2QuoteGasAdjusted)
    } else {
      const v3QuoteGasAdjusted = v3Trade.inputAmount.add(v3TradeAndApprovalGasCostInQuoteToken)
      const v2QuoteGasAdjusted = v2Trade.inputAmount.add(v2TradeAndApprovalGasCostInQuoteToken)
      console.debug(
        {
          v2SwapGasEstimate: v2SwapGasEstimateWei.toString(),
          v2ApprovalGasEstimate: v2TradeApprovalGasEstimateWei.toString(),
          v3SwapGasEstimate: v2GasEstimate.toString(),
          v3ApprovalGasEstimate: v3TradeApprovalGasEstimateWei.toString(),
          v3QuoteGasAdjusted: v3QuoteGasAdjusted.toString(),
          v3Quote: v3Trade.outputAmount.toString(),
          v2QuoteGasAdjusted: v2QuoteGasAdjusted.toString(),
          v2Quote: v2Trade.outputAmount.toString(),
        },
        `Swap and approval estimates ${tradeType.toString()} for V2 vs V3 trade`
      )

      return v2QuoteGasAdjusted.greaterThan(v3QuoteGasAdjusted)
    }
  }, [
    gasPrice,
    pools,
    quoteToken,
    tradeType,
    v2SwapGasEstimateWei,
    v2Trade,
    v2TradeApprovalGasEstimateWei,
    v3TradeApprovalGasEstimateWei,
    v3Trade.inputAmount,
    v3Trade.outputAmount,
    v3SwapGasEstimateWei,
    weth,
  ])
}
