import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { QuoteRequest, Routing, TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import { encodeFunctionData } from 'viem'

import { DiscriminatedQuoteResponse } from '../../TradingApiClient'
import { ERC20_ABI, QUOTER_V2_ABI } from '../abi'
import { client } from '../client'

async function getPoolState(poolAddress: string) {
  const [slot0, liquidity] = await Promise.all([
    client.readContract({
      address: poolAddress as `0x${string}`,
      abi: IUniswapV3PoolABI.abi,
      functionName: 'slot0',
    }) as Promise<[bigint, number, number, number, number, number, boolean]>,
    client.readContract({
      address: poolAddress as `0x${string}`,
      abi: IUniswapV3PoolABI.abi,
      functionName: 'liquidity',
    }) as Promise<bigint>,
  ])

  const [sqrtPriceX96, tick] = slot0

  return {
    sqrtPriceX96: sqrtPriceX96.toString(),
    tick: tick.toString(),
    liquidity: liquidity.toString(),
  }
}

export const quote = async (params: QuoteRequest): Promise<DiscriminatedQuoteResponse> => {
  // Validate required parameters
  if (!params.tokenIn || !params.tokenOut) {
    throw new Error('tokenIn and tokenOut must be defined')
  }
  if (!params.amount) {
    throw new Error('amount must be defined')
  }
  if (!params.swapper) {
    throw new Error('swapper address must be defined')
  }
  if (params.tokenInChainId !== params.tokenOutChainId) {
    throw new Error('Cross-chain swaps not supported for UniswapV3 quotes')
  }

  const chainId = params.tokenInChainId
  const quoterAddress = CHAIN_TO_ADDRESSES_MAP[10000]?.quoterAddress as `0x${string}`

  if (!quoterAddress) {
    throw new Error(`Quoter contract not available for chain ${chainId}`)
  }

  // Convert amount to BigInt
  const amountBigInt = BigInt(params.amount)

  // Default fee tier (0.3% = 3000)
  const fee = 3000

  // Set slippage tolerance (default 0.5%)
  const slippageTolerance = params.slippageTolerance ?? params.autoSlippage?.maxSlippage ?? 0.5

  const tokenInSymbol = (await client.readContract({
    address: params.tokenIn as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
  })) as string

  const tokenInDecimals = (await client.readContract({
    address: params.tokenIn as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })) as string

  const tokenOutDecimals = (await client.readContract({
    address: params.tokenOut as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'decimals',
  })) as string

  const tokenOutSymbol = (await client.readContract({
    address: params.tokenOut as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'symbol',
  })) as string

  const poolAddress = await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].v3CoreFactoryAddress as `0x${string}`,
    abi: IUniswapV3FactoryABI.abi,
    functionName: 'getPool',
    args: [params.tokenIn as `0x${string}`, params.tokenOut as `0x${string}`, '3000'],
  })

  const poolState = await getPoolState(poolAddress)

  try {
    let quoteResult: any

    if (params.type === TradeType.EXACT_INPUT) {
      // Get quote for exact input swap
      quoteResult = (await client.readContract({
        address: quoterAddress,
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactInputSingle',
        args: [
          {
            tokenIn: params.tokenIn as `0x${string}`,
            tokenOut: params.tokenOut as `0x${string}`,
            fee,
            amountIn: params.amount,
            sqrtPriceLimitX96: '0', // No price limit
          },
        ],
      })) as [bigint, bigint, bigint, bigint]

      const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = quoteResult

      // Calculate minimum amount out with slippage
      const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100))
      const amountOutMinimum = (amountOut * slippageMultiplier) / 10000n

      // Prepare swap calldata
      const swapCalldata = encodeFunctionData({
        abi: [
          {
            name: 'exactInputSingle',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenIn', type: 'address' },
                  { name: 'tokenOut', type: 'address' },
                  { name: 'fee', type: 'uint24' },
                  { name: 'recipient', type: 'address' },
                  { name: 'deadline', type: 'uint256' },
                  { name: 'amountIn', type: 'uint256' },
                  { name: 'amountOutMinimum', type: 'uint256' },
                  { name: 'sqrtPriceLimitX96', type: 'uint160' },
                ],
              },
            ],
            outputs: [{ name: 'amountOut', type: 'uint256' }],
          },
        ],
        functionName: 'exactInputSingle',
        args: [
          {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            fee: fee,
            recipient: params.swapper,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 1200), // 20 minutes from now
            amountIn: amountBigInt,
            amountOutMinimum: amountOutMinimum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      })

      return {
        routing: Routing.CLASSIC,
        quote: {
          methodParameters: {
            calldata: swapCalldata,
            value: '0',
          },
          blockNumber: await client.getBlockNumber(),
          amount: params.amount,
          amountDecimals: params.amount,
          quote: amountOut.toString(),
          quoteDecimals: amountOut.toString(),
          quoteGasAdjusted: amountOut.toString(),
          quoteGasAdjustedDecimals: amountOut.toString(),
          gasUseEstimate: gasEstimate.toString(),
          gasUseEstimateQuote: gasEstimate.toString(),
          gasUseEstimateQuoteDecimals: gasEstimate.toString(),
          gasUseEstimateUSD: '0',
          gasPriceWei: (await client.getGasPrice()).toString(),
          route: [
            [
              {
                type: 'v3-pool',
                address: poolAddress,
                tokenIn: {
                  chainId: chainId,
                  decimals: tokenInDecimals,
                  address: params.tokenIn,
                  symbol: tokenInSymbol, // Would need to fetch from token contract
                },
                tokenOut: {
                  chainId: chainId,
                  decimals: tokenOutDecimals,
                  address: params.tokenOut,
                  symbol: tokenOutSymbol, // Would need to fetch from token contract
                },
                fee: fee.toString(),
                liquidity: poolState.liquidity,
                sqrtRatioX96: poolState.sqrtPriceX96,
                tickCurrent: poolState.tick,
                amountIn: params.amount,
                amountOut: amountOut.toString(),
              },
            ],
          ],
          swapper: params.swapper,
          routeString: `${params.tokenIn} -> ${params.tokenOut}`,
          tradeType: TradeType.EXACT_INPUT,
          priceImpact: '0', // Would need to calculate based on pool reserves
          portionBips: 0,
          portionRecipient: undefined,
          portionAmount: undefined,
          portionAmountDecimals: undefined,
        },
      } as any // Cast to satisfy type requirements
    } else {
      // Get quote for exact output swap
      quoteResult = (await client.readContract({
        address: quoterAddress,
        abi: QUOTER_V2_ABI,
        functionName: 'quoteExactOutputSingle',
        args: [
          {
            tokenIn: params.tokenIn as `0x${string}`,
            tokenOut: params.tokenOut as `0x${string}`,
            fee: fee,
            amountOut: amountBigInt,
            sqrtPriceLimitX96: 0n,
          },
        ],
      })) as [bigint, bigint, bigint, bigint]

      const [amountIn, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = quoteResult

      // Calculate maximum amount in with slippage
      const slippageMultiplier = BigInt(Math.floor((100 + slippageTolerance) * 100))
      const amountInMaximum = (amountIn * slippageMultiplier) / 10000n

      // Prepare swap calldata
      const swapCalldata = encodeFunctionData({
        abi: [
          {
            name: 'exactOutputSingle',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenIn', type: 'address' },
                  { name: 'tokenOut', type: 'address' },
                  { name: 'fee', type: 'uint24' },
                  { name: 'recipient', type: 'address' },
                  { name: 'deadline', type: 'uint256' },
                  { name: 'amountOut', type: 'uint256' },
                  { name: 'amountInMaximum', type: 'uint256' },
                  { name: 'sqrtPriceLimitX96', type: 'uint160' },
                ],
              },
            ],
            outputs: [{ name: 'amountIn', type: 'uint256' }],
          },
        ],
        functionName: 'exactOutputSingle',
        args: [
          {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            fee: fee,
            recipient: params.swapper,
            deadline: BigInt(Math.floor(Date.now() / 1000) + 1200),
            amountOut: amountBigInt,
            amountInMaximum: amountInMaximum,
            sqrtPriceLimitX96: 0n,
          },
        ],
      })

      return {
        routing: Routing.CLASSIC,
        quote: {
          methodParameters: {
            calldata: swapCalldata,
            value: '0',
          },
          blockNumber: await client.getBlockNumber(),
          amount: amountIn.toString(),
          amountDecimals: amountIn.toString(),
          quote: params.amount,
          quoteDecimals: params.amount,
          quoteGasAdjusted: params.amount,
          quoteGasAdjustedDecimals: params.amount,
          gasUseEstimate: gasEstimate.toString(),
          gasUseEstimateQuote: gasEstimate.toString(),
          gasUseEstimateQuoteDecimals: gasEstimate.toString(),
          gasUseEstimateUSD: '0',
          gasPriceWei: (await client.getGasPrice()).toString(),
          route: [
            [
              {
                type: 'v3-pool',
                address: poolAddress,
                tokenIn: {
                  chainId: chainId,
                  decimals: tokenInDecimals,
                  address: params.tokenIn,
                  symbol: tokenInSymbol,
                },
                tokenOut: {
                  chainId: chainId,
                  decimals: tokenOutDecimals,
                  address: params.tokenOut,
                  symbol: tokenOutSymbol,
                },
                fee: fee.toString(),
                liquidity: poolState.liquidity,
                sqrtRatioX96: poolState.sqrtPriceX96,
                tickCurrent: poolState.tick,
                amountIn: amountIn.toString(),
                amountOut: params.amount,
              },
            ],
          ],
          swapper: params.swapper,
          routeString: `${params.tokenIn} -> ${params.tokenOut}`,
          tradeType: TradeType.EXACT_OUTPUT,
          priceImpact: '0',
          portionBips: 0,
          portionRecipient: undefined,
          portionAmount: undefined,
          portionAmountDecimals: undefined,
        },
      }
    }
  } catch (error) {
    console.error('Failed to get UniswapV3 quote:', error)
    throw new Error(`Quote failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
