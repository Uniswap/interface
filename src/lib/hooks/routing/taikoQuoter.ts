import { BigNumber } from '@ethersproject/bignumber'
import { TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { TAIKO_HOODI_ADDRESSES, TAIKO_HOODI_CHAIN_ID } from 'config/chains'
import { RPC_PROVIDERS } from 'constants/providers'
import { GetQuoteArgs, QuoteResult, QuoteState, SwapRouterNativeAssets } from 'state/routing/types'
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

    const quoter = Quoter__factory.connect(quoterAddress, provider)

    // Try common fee tiers in order: 0.3%, 0.05%, 1%, 0.01%
    const feeTiers = [FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.HIGH, FeeAmount.LOWEST]

    for (const fee of feeTiers) {
      try {
        console.log(`🔵 Trying fee tier: ${fee}`)

        // First check if pool exists
        const poolAddress = await quoter.factory().then((factoryAddr: string) => {
          const { Contract } = require('@ethersproject/contracts')
          const factory = new Contract(factoryAddr, ['function getPool(address,address,uint24) view returns (address)'], provider)
          return factory.getPool(actualTokenInAddress, actualTokenOutAddress, fee)
        })

        console.log(`🔵 Pool address for fee ${fee}:`, poolAddress)

        if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
          console.log(`⚠️ No pool for fee tier ${fee}`)
          continue
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

          console.log(`✅ Got quote: amountOut = ${amountOut.toString()}`)

          if (amountOut && !BigNumber.from(amountOut).isZero()) {
            return {
              state: QuoteState.SUCCESS,
              data: {
                quote: amountOut.toString(),
                quoteGasAdjusted: amountOut.toString(),
                gasUseEstimate: '200000', // V1 doesn't return gas estimate
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
                  sqrtRatioX96: '0',
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
          // EXACT_OUTPUT - Quoter V1 uses separate parameters
          const amountIn = await quoter.callStatic.quoteExactOutputSingle(
            actualTokenInAddress,
            actualTokenOutAddress,
            fee,
            amount,
            0 // sqrtPriceLimitX96
          )

          if (amountIn && !BigNumber.from(amountIn).isZero()) {
            return {
              state: QuoteState.SUCCESS,
              data: {
                quote: amountIn.toString(),
                quoteGasAdjusted: amountIn.toString(),
                gasUseEstimate: '200000',
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
                  sqrtRatioX96: '0',
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
