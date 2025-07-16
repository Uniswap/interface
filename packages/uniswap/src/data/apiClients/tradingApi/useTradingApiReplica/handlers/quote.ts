import { CHAIN_TO_ADDRESSES_MAP } from '@uniswap/sdk-core'
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { QuoteRequest, Routing, TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import { encodeFunctionData } from 'viem'

import { DiscriminatedQuoteResponse } from '../../TradingApiClient'
import { ERC20_ABI, QUOTER_V2_ABI } from '../abi'
import { client } from '../client'
import { chainInfo } from '../constants'

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

function isNativeToken(tokenAddress: string, chainId: number): boolean {
  return (
    tokenAddress.toLowerCase() === chainInfo.nativeCurrency.address.toLowerCase() ||
    tokenAddress.toLowerCase() === '0x0000000000000000000000000000000000000000'
  )
}

function createMulticallData(calls: string[], deadline?: number): string {
  return encodeFunctionData({
    abi: [
      {
        name: 'multicall',
        type: 'function',
        inputs: [
          { name: 'deadline', type: 'uint256' },
          { name: 'data', type: 'bytes[]' },
        ],
        outputs: [{ name: 'results', type: 'bytes[]' }],
      },
    ],
    functionName: 'multicall',
    args: [
      deadline ?? BigInt(Math.floor(Date.now() / 1000) + 1800), // 20 minutes from now
      calls,
    ],
  })
}

export const quote = async (
  params: QuoteRequest & { deadline: number | undefined },
): Promise<DiscriminatedQuoteResponse> => {
  console.log('quoteParams', params)

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
  const quoterAddress = CHAIN_TO_ADDRESSES_MAP[10000].quoterAddress as `0x${string}`
  const routerAddress = CHAIN_TO_ADDRESSES_MAP[10000].swapRouter02Address as `0x${string}`

  if (!quoterAddress) {
    throw new Error(`Quoter contract not available for chain ${chainId}`)
  }
  if (!routerAddress) {
    throw new Error(`Router contract not available for chain ${chainId}`)
  }

  // Convert amount to BigInt
  const amountBigInt = BigInt(params.amount)

  // Default fee tier (0.3% = 3000)
  const fee = 3000

  // Set slippage tolerance (default 0.5%)
  const slippageTolerance = params.slippageTolerance ?? 0.5

  // Check if we're dealing with native tokens
  const isTokenInNative = isNativeToken(params.tokenIn, chainId)
  const isTokenOutNative = isNativeToken(params.tokenOut, chainId)

  // Get token information
  const tokenInSymbol = isTokenInNative
    ? chainInfo.nativeCurrency.symbol
    : ((await client.readContract({
        address: params.tokenIn as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      })) as string)

  const tokenInDecimals = isTokenInNative
    ? chainInfo.nativeCurrency.decimals
    : ((await client.readContract({
        address: params.tokenIn as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      })) as string)

  const tokenOutDecimals = isTokenOutNative
    ? chainInfo.nativeCurrency.decimals
    : ((await client.readContract({
        address: params.tokenOut as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'decimals',
      })) as string)

  const tokenOutSymbol = isTokenOutNative
    ? chainInfo.nativeCurrency.symbol
    : ((await client.readContract({
        address: params.tokenOut as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'symbol',
      })) as string)

  const poolTokenIn = isTokenInNative ? chainInfo.wrappedNativeCurrency.address : params.tokenIn
  const poolTokenOut = isTokenOutNative ? chainInfo.wrappedNativeCurrency.address : params.tokenOut

  // Get pool address
  const poolAddress = (await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].v3CoreFactoryAddress as `0x${string}`,
    abi: IUniswapV3FactoryABI.abi,
    functionName: 'getPool',
    args: [poolTokenIn as `0x${string}`, poolTokenOut as `0x${string}`, fee],
  })) as `0x${string}`

  if (!poolAddress || poolAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error(`Pool not found for token pair`)
  }

  const poolState = await getPoolState(poolAddress)

  try {
    let quoteResult: any
    let multicallData: string

    switch (params.type) {
      case TradeType.EXACT_INPUT: {
        // Get quote for exact input swap
        quoteResult = (await client.readContract({
          address: quoterAddress,
          abi: QUOTER_V2_ABI,
          functionName: 'quoteExactInputSingle',
          args: [
            {
              tokenIn: poolTokenIn as `0x${string}`,
              tokenOut: poolTokenOut as `0x${string}`,
              fee,
              amountIn: params.amount,
              sqrtPriceLimitX96: '0',
            },
          ],
        })) as [bigint, bigint, bigint, bigint]

        const [amountOut, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = quoteResult

        // Calculate minimum amount out with slippage
        const slippageMultiplier = BigInt(Math.floor((100 - slippageTolerance) * 100))
        const amountOutMinimum = (amountOut * slippageMultiplier) / BigInt(10000)

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
              tokenIn: poolTokenIn,
              tokenOut: poolTokenOut,
              fee: fee,
              recipient: isTokenOutNative ? routerAddress : params.swapper, // Use zero address for native unwrapping
              amountIn: params.amount,
              amountOutMinimum: amountOutMinimum.toString(),
              sqrtPriceLimitX96: '0',
            },
          ],
        })

        const calls = [swapCalldata]

        // Add unwrap call if output token is native
        if (isTokenOutNative) {
          const unwrapCalldata = encodeFunctionData({
            abi: [
              {
                name: 'unwrapWETH9',
                type: 'function',
                inputs: [
                  { name: 'amountMinimum', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                ],
                outputs: [],
              },
            ],
            functionName: 'unwrapWETH9',
            args: [amountOutMinimum.toString(), params.swapper],
          })
          calls.push(unwrapCalldata)
        }

        multicallData = createMulticallData(calls, params.deadline)

        return {
          routing: Routing.CLASSIC,
          quote: {
            methodParameters: {
              calldata: multicallData,
              value: isTokenInNative ? params.amount : '0',
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
                    address: poolTokenIn,
                    symbol: tokenInSymbol,
                  },
                  tokenOut: {
                    chainId: chainId,
                    decimals: tokenOutDecimals,
                    address: poolTokenOut,
                    symbol: tokenOutSymbol,
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
            routeString: `${tokenInSymbol} -> ${tokenOutSymbol}`,
            tradeType: TradeType.EXACT_INPUT,
            priceImpact: '0',
            portionBips: 0,
            portionRecipient: undefined,
            portionAmount: undefined,
            portionAmountDecimals: undefined,
          },
        } as any
      }
      case TradeType.EXACT_OUTPUT: {
        // Get quote for exact output swap
        quoteResult = (await client.readContract({
          address: quoterAddress,
          abi: QUOTER_V2_ABI,
          functionName: 'quoteExactOutputSingle',
          args: [
            {
              tokenIn: poolTokenIn as `0x${string}`,
              tokenOut: poolTokenOut as `0x${string}`,
              fee: fee,
              amount: params.amount,
              sqrtPriceLimitX96: '0',
            },
          ],
        })) as [bigint, bigint, bigint, bigint]

        const [amountIn, sqrtPriceX96After, initializedTicksCrossed, gasEstimate] = quoteResult

        // Calculate maximum amount in with slippage
        const slippageMultiplier = BigInt(Math.floor((100 + slippageTolerance) * 100))
        const amountInMaximum = (amountIn * slippageMultiplier) / BigInt(10000)

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
              tokenIn: poolTokenIn,
              tokenOut: poolTokenOut,
              fee: fee,
              recipient: isTokenOutNative ? routerAddress : params.swapper,
              amountOut: params.amount,
              amountInMaximum: amountInMaximum.toString(),
              sqrtPriceLimitX96: '0',
            },
          ],
        })

        const calls = [swapCalldata]

        // Add unwrap call if output token is native
        if (isTokenOutNative) {
          const unwrapCalldata = encodeFunctionData({
            abi: [
              {
                name: 'unwrapWETH9',
                type: 'function',
                inputs: [
                  { name: 'amountMinimum', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                ],
                outputs: [],
              },
            ],
            functionName: 'unwrapWETH9',
            args: [params.amount, params.swapper],
          })
          calls.push(unwrapCalldata)
        }

        // Add refund call if input token is native (to refund excess ETH)
        if (isTokenInNative) {
          const refundCalldata = encodeFunctionData({
            abi: [
              {
                name: 'refundETH',
                type: 'function',
                inputs: [],
                outputs: [],
              },
            ],
            functionName: 'refundETH',
            args: [],
          })
          calls.push(refundCalldata)
        }

        multicallData = createMulticallData(calls)

        return {
          routing: Routing.CLASSIC,
          quote: {
            methodParameters: {
              calldata: multicallData,
              value: isTokenInNative ? amountInMaximum.toString() : '0',
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
                    address: poolTokenIn,
                    symbol: tokenInSymbol,
                  },
                  tokenOut: {
                    chainId: chainId,
                    decimals: tokenOutDecimals,
                    address: poolTokenOut,
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
            routeString: `${tokenInSymbol} -> ${tokenOutSymbol}`,
            tradeType: TradeType.EXACT_OUTPUT,
            priceImpact: '0',
            portionBips: 0,
            portionRecipient: undefined,
            portionAmount: undefined,
            portionAmountDecimals: undefined,
          },
        }
      }
    }
  } catch (error) {
    console.error('Failed to get UniswapV3 quote:', error)
    throw new Error(`Quote failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
