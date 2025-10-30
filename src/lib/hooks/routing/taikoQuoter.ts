import { BigNumber } from '@ethersproject/bignumber'
import { TradeType } from '@uniswap/sdk-core'
import { ZERO_ADDRESS } from '@uniswap/universal-router-sdk/dist/utils/constants'
import { FeeAmount } from '@uniswap/v3-sdk'
import { TAIKO_HOODI_ADDRESSES, TAIKO_HOODI_CHAIN_ID } from 'config/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { GetQuoteArgs, QuoteResult, QuoteState, SwapRouterNativeAssets, URAQuoteType } from 'state/routing/types'
import { Quoter__factory } from 'types/v3/factories/Quoter__factory'

/**
 * Get a quote for a simple swap on Taiko using the on-chain QuoterV2 contract
 * This is a simplified quoter that only supports single-hop swaps
 */
export async function getTaikoQuote(args: GetQuoteArgs): Promise<QuoteResult> {
  const {
    tokenInAddress,
    tokenInChainId,
    tokenOutAddress,
    tokenOutChainId,
    amount,
    tradeType,
  } = args

  // Only support Taiko Hoodi chain
  if (tokenInChainId !== TAIKO_HOODI_CHAIN_ID || tokenOutChainId !== TAIKO_HOODI_CHAIN_ID) {
    return { state: QuoteState.NOT_FOUND }
  }

  try {
    const provider = RPC_PROVIDERS[TAIKO_HOODI_CHAIN_ID]
    const quoterAddress = TAIKO_HOODI_ADDRESSES.quoterV2

    if (!quoterAddress || quoterAddress === ZERO_ADDRESS) {
      return { state: QuoteState.NOT_FOUND }
    }

    // Convert native ETH to WETH address for quoter
    // The quoter only understands ERC20 token addresses, not native asset identifiers
    const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenInAddress as SwapRouterNativeAssets)
    const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOutAddress as SwapRouterNativeAssets)

    const actualTokenInAddress = tokenInIsNative ? TAIKO_HOODI_ADDRESSES.weth9 : tokenInAddress
    const actualTokenOutAddress = tokenOutIsNative ? TAIKO_HOODI_ADDRESSES.weth9 : tokenOutAddress

    const quoter = Quoter__factory.connect(quoterAddress, provider)

    // Try common fee tiers in order: 0.3%, 0.05%, 1%, 0.01%
    const feeTiers = [FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.HIGH, FeeAmount.LOWEST]

    for (const fee of feeTiers) {
      try {
        // First check if pool exists
        const poolAddress = await quoter.factory().then((factoryAddr: string) => {
          const { Contract } = require('@ethersproject/contracts')
          const factory = new Contract(factoryAddr, ['function getPool(address,address,uint24) view returns (address)'], provider)
          return factory.getPool(actualTokenInAddress, actualTokenOutAddress, fee)
        })

        if (!poolAddress || poolAddress === ZERO_ADDRESS) {
          continue
        }

        // Fetch actual pool state - REQUIRED for SDK Pool validation
        const { Contract } = require('@ethersproject/contracts')
        const poolContract = new Contract(
          poolAddress,
          [
            'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
            'function liquidity() view returns (uint128)',
          ],
          provider
        )

        const [slot0, liquidity] = await Promise.all([poolContract.slot0(), poolContract.liquidity()])

        if (tradeType === TradeType.EXACT_INPUT) {
          // Quoter V1 uses separate parameters, not a struct
          const amountOut = await quoter.callStatic.quoteExactInputSingle(
            actualTokenInAddress,
            actualTokenOutAddress,
            fee,
            amount,
            0 // sqrtPriceLimitX96
          )

          if (amountOut && !BigNumber.from(amountOut).isZero()) {
            const blockNumber = await provider.getBlockNumber().then(String)

            // Match EXACT ClassicQuoteData structure from API
            const classicQuote = {
              blockNumber,
              amount: amount,
              amountDecimals: amount,
              gasPriceWei: '1000000000', // 1 gwei default
              gasUseEstimate: '200000',
              gasUseEstimateQuote: '200000',
              gasUseEstimateQuoteDecimals: '200000',
              gasUseEstimateUSD: '0.5',
              quote: amountOut.toString(),
              quoteDecimals: amountOut.toString(),
              quoteGasAdjusted: amountOut.toString(),
              quoteGasAdjustedDecimals: amountOut.toString(),
              route: [[{
                type: 'v3-pool',
                tokenIn: {
                  chainId: tokenInChainId,
                  decimals: args.tokenInDecimals,
                  address: actualTokenInAddress,
                  symbol: args.tokenInSymbol,
                },
                tokenOut: {
                  chainId: tokenOutChainId,
                  decimals: args.tokenOutDecimals,
                  address: actualTokenOutAddress,
                  symbol: args.tokenOutSymbol,
                },
                fee: fee.toString(),
                liquidity: liquidity.toString(),
                sqrtRatioX96: slot0.sqrtPriceX96.toString(),
                tickCurrent: slot0.tick.toString(),
                amountIn: amount,
                amountOut: amountOut.toString(),
              }]],
              routeString: `[V3] ${args.tokenInSymbol} --> ${args.tokenOutSymbol}`,
            }

            return {
              state: QuoteState.SUCCESS,
              data: {
                routing: URAQuoteType.CLASSIC,
                quote: classicQuote,
                allQuotes: [{
                  routing: URAQuoteType.CLASSIC,
                  quote: classicQuote,
                  allQuotes: [],
                }],
              },
            }
          }
        } else {
          // EXACT_OUTPUT - Quoter V1 uses separate parameters
          const amountIn = await quoter.callStatic.quoteExactOutputSingle(
            actualTokenInAddress,
            actualTokenOutAddress,
            fee,
            amount,
            0 // sqrtPriceLimitX96
          )

          if (amountIn && !BigNumber.from(amountIn).isZero()) {
            const blockNumber = await provider.getBlockNumber().then(String)

            // Match EXACT ClassicQuoteData structure from API
            const classicQuote = {
              blockNumber,
              amount: amount,
              amountDecimals: amount,
              gasPriceWei: '1000000000', // 1 gwei default
              gasUseEstimate: '200000',
              gasUseEstimateQuote: '200000',
              gasUseEstimateQuoteDecimals: '200000',
              gasUseEstimateUSD: '0.5',
              quote: amountIn.toString(),
              quoteDecimals: amountIn.toString(),
              quoteGasAdjusted: amountIn.toString(),
              quoteGasAdjustedDecimals: amountIn.toString(),
              route: [[{
                type: 'v3-pool',
                tokenIn: {
                  chainId: tokenInChainId,
                  decimals: args.tokenInDecimals,
                  address: actualTokenInAddress,
                  symbol: args.tokenInSymbol,
                },
                tokenOut: {
                  chainId: tokenOutChainId,
                  decimals: args.tokenOutDecimals,
                  address: actualTokenOutAddress,
                  symbol: args.tokenOutSymbol,
                },
                fee: fee.toString(),
                liquidity: liquidity.toString(),
                sqrtRatioX96: slot0.sqrtPriceX96.toString(),
                tickCurrent: slot0.tick.toString(),
                amountIn: amountIn.toString(),
                amountOut: amount,
              }]],
              routeString: `[V3] ${args.tokenInSymbol} --> ${args.tokenOutSymbol}`,
            }

            return {
              state: QuoteState.SUCCESS,
              data: {
                routing: URAQuoteType.CLASSIC,
                quote: classicQuote,
                allQuotes: [{
                  routing: URAQuoteType.CLASSIC,
                  quote: classicQuote,
                  allQuotes: [],
                }],
              },
            }
          }
        }
      } catch (poolError: any) {
        // Pool doesn't exist or has no liquidity for this fee tier, try next one
        continue
      }
    }

    // No pool found with any fee tier
    return { state: QuoteState.NOT_FOUND }
  } catch (error: any) {
    // Log errors in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Taiko quoter error:', error)
    }
    return { state: QuoteState.NOT_FOUND }
  }
}
