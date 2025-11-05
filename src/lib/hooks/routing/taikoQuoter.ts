import { BigNumber } from '@ethersproject/bignumber'
import { TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { getChainAddresses, isTaikoChain, TAIKO_HOODI_CHAIN_ID, TAIKO_MAINNET_CHAIN_ID } from 'config/chains'
import { ZERO_ADDRESS } from 'constants/misc'
import { RPC_PROVIDERS } from 'constants/providers'
import { GetQuoteArgs, QuoteResult, QuoteState, SwapRouterNativeAssets, URAQuoteType } from 'state/routing/types'
import { Quoter__factory } from 'types/v3/factories/Quoter__factory'

/**
 * Get a quote for a simple swap on Taiko using the on-chain QuoterV2 contract
 * This is a simplified quoter that only supports single-hop swaps
 * Supports both Taiko mainnet and testnet (Hoodi)
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

  // Only support Taiko chains (mainnet and testnet)
  if (!isTaikoChain(tokenInChainId) || tokenInChainId !== tokenOutChainId) {
    return { state: QuoteState.NOT_FOUND }
  }

  try {
    const provider = RPC_PROVIDERS[tokenInChainId]
    const chainAddresses = getChainAddresses(tokenInChainId)

    if (!chainAddresses) {
      return { state: QuoteState.NOT_FOUND }
    }

    const quoterAddress = chainAddresses.quoterV2

    if (!quoterAddress || quoterAddress === ZERO_ADDRESS) {
      return { state: QuoteState.NOT_FOUND }
    }

    // Convert native ETH to WETH address for quoter
    // The quoter only understands ERC20 token addresses, not native asset identifiers
    const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenInAddress as SwapRouterNativeAssets)
    const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOutAddress as SwapRouterNativeAssets)

    const actualTokenInAddress = tokenInIsNative ? chainAddresses.weth9 : tokenInAddress
    const actualTokenOutAddress = tokenOutIsNative ? chainAddresses.weth9 : tokenOutAddress

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
            'function token0() view returns (address)',
            'function token1() view returns (address)',
            'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
            'function liquidity() view returns (uint128)',
          ],
          provider
        )

        const [token0Address, token1Address, slot0, liquidity] = await Promise.all([
          poolContract.token0(),
          poolContract.token1(),
          poolContract.slot0(),
          poolContract.liquidity(),
        ])

        // Create token objects for actual swap direction
        // The route should ALWAYS match the actual swap direction (tokenIn → tokenOut)
        // NOT the pool's canonical token order
        // The Uniswap SDK's Pool constructor handles token sorting automatically
        const swapTokenIn = {
          chainId: tokenInChainId,
          decimals: args.tokenInDecimals,
          address: actualTokenInAddress,
          symbol: args.tokenInSymbol,
        }

        const swapTokenOut = {
          chainId: tokenOutChainId,
          decimals: args.tokenOutDecimals,
          address: actualTokenOutAddress,
          symbol: args.tokenOutSymbol,
        }

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
            // Route data MUST match the actual swap direction (tokenIn → tokenOut)
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
                tokenIn: swapTokenIn,
                tokenOut: swapTokenOut,
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
            // Route data MUST match the actual swap direction (tokenIn → tokenOut)
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
                tokenIn: swapTokenIn,
                tokenOut: swapTokenOut,
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
