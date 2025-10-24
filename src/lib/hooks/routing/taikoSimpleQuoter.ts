import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { TradeType } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route, SwapQuoter, Trade } from '@uniswap/v3-sdk'
import { TAIKO_HOODI_ADDRESSES, TAIKO_HOODI_CHAIN_ID } from 'config/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import JSBI from 'jsbi'
import { GetQuoteArgs, QuoteResult, QuoteState, SwapRouterNativeAssets } from 'state/routing/types'

const POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function fee() view returns (uint24)',
  'function liquidity() view returns (uint128)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
]

const FACTORY_ABI = ['function getPool(address,address,uint24) view returns (address)']

/**
 * Simple quoter for Taiko that uses pool price math instead of QuoterV2
 * This is a simplified approach good enough for testnets
 */
export async function getTaikoSimpleQuote(args: GetQuoteArgs): Promise<QuoteResult> {
  const { tokenInAddress, tokenInChainId, tokenOutAddress, tokenOutChainId, amount, tradeType } = args

  console.log('🟢 Taiko Simple Quoter called:', {
    tokenInAddress,
    tokenOutAddress,
    amount,
    tradeType: tradeType === TradeType.EXACT_INPUT ? 'EXACT_INPUT' : 'EXACT_OUTPUT',
  })

  // Only support Taiko Hoodi chain
  if (tokenInChainId !== TAIKO_HOODI_CHAIN_ID || tokenOutChainId !== TAIKO_HOODI_CHAIN_ID) {
    console.log('❌ Chain mismatch')
    return { state: QuoteState.NOT_FOUND }
  }

  // Convert native ETH to WETH address
  const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenInAddress as SwapRouterNativeAssets)
  const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOutAddress as SwapRouterNativeAssets)

  const actualTokenInAddress = tokenInIsNative ? TAIKO_HOODI_ADDRESSES.weth9 : tokenInAddress
  const actualTokenOutAddress = tokenOutIsNative ? TAIKO_HOODI_ADDRESSES.weth9 : tokenOutAddress

  console.log('🟢 Token addresses:', { tokenIn: actualTokenInAddress, tokenOut: actualTokenOutAddress })

  try {
    const provider = RPC_PROVIDERS[TAIKO_HOODI_CHAIN_ID]
    const factory = new Contract(TAIKO_HOODI_ADDRESSES.factory, FACTORY_ABI, provider)

    // Try fee tiers in order: 0.01%, 0.05%, 0.3%, 1%
    const feeTiers = [FeeAmount.LOWEST, FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH]

    for (const fee of feeTiers) {
      try {
        console.log(`🟢 Trying fee tier: ${fee}`)

        const poolAddress = await factory.getPool(actualTokenInAddress, actualTokenOutAddress, fee)

        if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`⚠️ No pool for fee tier ${fee}`)
          continue
        }

        console.log(`🟢 Found pool at: ${poolAddress}`)

        const pool = new Contract(poolAddress, POOL_ABI, provider)
        const [token0, token1, poolFee, liquidity, slot0] = await Promise.all([
          pool.token0(),
          pool.token1(),
          pool.fee(),
          pool.liquidity(),
          pool.slot0(),
        ])

        console.log(`🟢 Pool state:`, {
          token0,
          token1,
          fee: poolFee.toString(),
          liquidity: liquidity.toString(),
          sqrtPriceX96: slot0.sqrtPriceX96.toString(),
          tick: slot0.tick.toString(),
        })

        // Check if pool has liquidity
        if (liquidity.isZero()) {
          console.log(`⚠️ Pool has no liquidity`)
          continue
        }

        // Calculate price: price = (sqrtPriceX96 / 2^96) ^ 2
        // For small amounts, we can approximate: amountOut ≈ amountIn * price (or 1/price depending on direction)
        const sqrtPriceX96 = JSBI.BigInt(slot0.sqrtPriceX96.toString())
        const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))

        // Determine swap direction
        const zeroForOne = actualTokenInAddress.toLowerCase() === token0.toLowerCase()

        let estimatedOutput: JSBI

        if (tradeType === TradeType.EXACT_INPUT) {
          const amountIn = JSBI.BigInt(amount)

          if (zeroForOne) {
            // Swapping token0 for token1: output = input * (sqrtPrice^2)
            // This is approximate - real calculation would account for slippage and fees
            const price = JSBI.divide(JSBI.multiply(sqrtPriceX96, sqrtPriceX96), Q96)
            estimatedOutput = JSBI.divide(JSBI.multiply(amountIn, price), Q96)
          } else {
            // Swapping token1 for token0: output = input / (sqrtPrice^2)
            const price = JSBI.divide(JSBI.multiply(sqrtPriceX96, sqrtPriceX96), Q96)
            estimatedOutput = JSBI.divide(JSBI.multiply(amountIn, Q96), price)
          }

          // Apply fee (approximately)
          const feeMultiplier = JSBI.BigInt(1000000 - fee)
          estimatedOutput = JSBI.divide(JSBI.multiply(estimatedOutput, feeMultiplier), JSBI.BigInt(1000000))

          console.log(`🟢 Estimated output: ${estimatedOutput.toString()}`)

          if (JSBI.greaterThan(estimatedOutput, JSBI.BigInt(0))) {
            return {
              state: QuoteState.SUCCESS,
              data: {
                quote: estimatedOutput.toString(),
                quoteGasAdjusted: estimatedOutput.toString(),
                gasUseEstimate: '200000',
                route: [
                  [
                    {
                      type: 'v3-pool',
                      tokenIn: {
                        chainId: tokenInChainId,
                        decimals: args.tokenInDecimals,
                        address: tokenInAddress,
                        symbol: args.tokenInSymbol,
                      },
                      tokenOut: {
                        chainId: tokenOutChainId,
                        decimals: args.tokenOutDecimals,
                        address: tokenOutAddress,
                        symbol: args.tokenOutSymbol,
                      },
                      fee: fee.toString(),
                      liquidity: liquidity.toString(),
                      sqrtRatioX96: slot0.sqrtPriceX96.toString(),
                      tickCurrent: slot0.tick.toString(),
                      amountIn: amount,
                      amountOut: estimatedOutput.toString(),
                    },
                  ],
                ],
                routeString: `[V3] ${args.tokenInSymbol} --> ${args.tokenOutSymbol}`,
                blockNumber: await provider.getBlockNumber().then(String),
              },
            }
          }
        }
      } catch (poolError: any) {
        console.log(`⚠️ Fee tier ${fee} failed:`, poolError.reason || poolError.message)
        continue
      }
    }

    console.log('❌ No suitable pool found')
    return { state: QuoteState.NOT_FOUND }
  } catch (error: any) {
    console.error('❌ Taiko simple quoter error:', error)
    return { state: QuoteState.NOT_FOUND }
  }
}
