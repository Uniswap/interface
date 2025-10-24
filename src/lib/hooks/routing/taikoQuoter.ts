import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { TAIKO_HOODI_ADDRESSES, TAIKO_HOODI_CHAIN_ID } from 'config/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { GetQuoteArgs, QuoteResult, QuoteState, SwapRouterNativeAssets } from 'state/routing/types'

const QUOTER_V2_ABI = [
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactOutputSingle((address tokenIn, address tokenOut, uint256 amount, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountIn, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
]

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

  console.log('🔵 Taiko Quoter called:', {
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

  try {
    const provider = RPC_PROVIDERS[TAIKO_HOODI_CHAIN_ID]
    const quoterAddress = TAIKO_HOODI_ADDRESSES.quoterV2

    console.log('🔵 Using QuoterV2 at:', quoterAddress)

    if (!quoterAddress || quoterAddress === '0x0000000000000000000000000000000000000000') {
      console.warn('QuoterV2 not configured for Taiko Hoodi')
      return { state: QuoteState.NOT_FOUND }
    }

    // Convert native ETH to WETH address for quoter
    // The quoter only understands ERC20 token addresses, not native asset identifiers
    const tokenInIsNative = Object.values(SwapRouterNativeAssets).includes(tokenInAddress as SwapRouterNativeAssets)
    const tokenOutIsNative = Object.values(SwapRouterNativeAssets).includes(tokenOutAddress as SwapRouterNativeAssets)

    const actualTokenInAddress = tokenInIsNative ? TAIKO_HOODI_ADDRESSES.weth9 : tokenInAddress
    const actualTokenOutAddress = tokenOutIsNative ? TAIKO_HOODI_ADDRESSES.weth9 : tokenOutAddress

    console.log('🔵 Token addresses (after native conversion):', {
      tokenIn: actualTokenInAddress,
      tokenOut: actualTokenOutAddress,
    })

    const quoter = new Contract(quoterAddress, QUOTER_V2_ABI, provider)

    // Try common fee tiers in order: 0.3%, 0.05%, 1%, 0.01%
    const feeTiers = [FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.HIGH, FeeAmount.LOWEST]

    for (const fee of feeTiers) {
      try {
        console.log(`🔵 Trying fee tier: ${fee}`)
        let result: any

        if (tradeType === TradeType.EXACT_INPUT) {
          result = await quoter.callStatic.quoteExactInputSingle({
            tokenIn: actualTokenInAddress,
            tokenOut: actualTokenOutAddress,
            amountIn: amount,
            fee,
            sqrtPriceLimitX96: 0,
          })

          const amountOut = result.amountOut || result[0]
          console.log(`✅ Got quote: amountOut = ${amountOut}`)

          if (amountOut && !BigNumber.from(amountOut).isZero()) {
            return {
              state: QuoteState.SUCCESS,
              data: {
                quote: amountOut.toString(),
                quoteGasAdjusted: amountOut.toString(),
                gasUseEstimate: result.gasEstimate?.toString() || '200000',
                route: [[{
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
                  liquidity: '0',
                  sqrtRatioX96: result.sqrtPriceX96After?.toString() || '0',
                  tickCurrent: '0',
                  amountIn: amount,
                  amountOut: amountOut.toString(),
                }]],
                routeString: `[V3] ${args.tokenInSymbol} --> ${args.tokenOutSymbol}`,
                blockNumber: await provider.getBlockNumber().then(String),
              },
            }
          }
        } else {
          // EXACT_OUTPUT
          result = await quoter.callStatic.quoteExactOutputSingle({
            tokenIn: actualTokenInAddress,
            tokenOut: actualTokenOutAddress,
            amount,
            fee,
            sqrtPriceLimitX96: 0,
          })

          const amountIn = result.amountIn || result[0]

          if (amountIn && !BigNumber.from(amountIn).isZero()) {
            return {
              state: QuoteState.SUCCESS,
              data: {
                quote: amountIn.toString(),
                quoteGasAdjusted: amountIn.toString(),
                gasUseEstimate: result.gasEstimate?.toString() || '200000',
                route: [[{
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
                  liquidity: '0',
                  sqrtRatioX96: result.sqrtPriceX96After?.toString() || '0',
                  tickCurrent: '0',
                  amountIn: amountIn.toString(),
                  amountOut: amount,
                }]],
                routeString: `[V3] ${args.tokenInSymbol} --> ${args.tokenOutSymbol}`,
                blockNumber: await provider.getBlockNumber().then(String),
              },
            }
          }
        }
      } catch (poolError: any) {
        // Pool doesn't exist or has no liquidity for this fee tier, try next one
        console.log(`⚠️ Fee tier ${fee} failed:`, poolError.reason || poolError.message)
        continue
      }
    }

    // No pool found with any fee tier
    console.log('❌ No pool found with any fee tier')
    return { state: QuoteState.NOT_FOUND }
  } catch (error: any) {
    console.error('❌ Taiko quoter error:', error)
    return { state: QuoteState.NOT_FOUND }
  }
}
