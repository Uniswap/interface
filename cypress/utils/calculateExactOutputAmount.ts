import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { parseUnits } from '@ethersproject/units'
import { Wallet } from '@ethersproject/wallet'
import { BigintIsh, CurrencyAmount, Fraction, Percent, SupportedChainId, WETH9 } from '@uniswap/sdk-core'
import { abi as IUniswapV3PoolStateABI } from '@uniswap/v3-core/artifacts/contracts/interfaces/pool/IUniswapV3PoolState.sol/IUniswapV3PoolState.json'
import TickLensJson from '@uniswap/v3-periphery/artifacts/contracts/lens/TickLens.sol/TickLens.json'
import { FeeAmount, nearestUsableTick, Pool, Route, TICK_SPACINGS, TickMath, Trade } from '@uniswap/v3-sdk'

import { TICK_LENS_ADDRESSES, V3_CORE_FACTORY_ADDRESSES } from '../../src/constants/addresses'
import { USDC_MAINNET } from '../../src/constants/tokens'
import { TickLens } from '../../src/types/v3/TickLens'
import { UniswapV3Pool, UniswapV3PoolInterface } from '../../src/types/v3/UniswapV3Pool'

const { abi: TickLensABI } = TickLensJson

const bitmapIndex = (tick: number, tickSpacing: number) => {
  return Math.floor(tick / tickSpacing / 256)
}

export async function calculateExactOutputAmount(
  amountIn: BigintIsh,
  slippagePercent: number,
  signer: Wallet
): Promise<BigNumber> {
  const poolInterface = new Interface(IUniswapV3PoolStateABI) as UniswapV3PoolInterface
  const poolAddress = Pool.getAddress(
    WETH9[SupportedChainId.MAINNET].wrapped,
    USDC_MAINNET?.wrapped,
    FeeAmount.LOW,
    undefined,
    V3_CORE_FACTORY_ADDRESSES[SupportedChainId.MAINNET]
  )
  console.log('poolAddress', poolAddress)
  const poolContract = new Contract(poolAddress, poolInterface, signer) as UniswapV3Pool
  console.log('poolContract', poolContract)
  // Fetch the current pool state
  const [{ sqrtPriceX96, tick }, liquidity] = await Promise.all([poolContract.slot0(), poolContract.liquidity()])

  // Create a Uniswap V3 Pool instance
  const tokenIn = WETH9[SupportedChainId.MAINNET]
  const tokenOut = USDC_MAINNET
  const tickLensAddress = TICK_LENS_ADDRESSES[SupportedChainId.MAINNET]
  console.log('tickLensAddress', tickLensAddress)
  const lensContract = new Contract(tickLensAddress, TickLensABI, signer) as TickLens
  console.log('lensContract', lensContract)
  const tickSpacing = TICK_SPACINGS[FeeAmount.LOW]
  const minIndex = bitmapIndex(nearestUsableTick(TickMath.MIN_TICK, tickSpacing), tickSpacing)
  const maxIndex = bitmapIndex(nearestUsableTick(TickMath.MAX_TICK, tickSpacing), tickSpacing)
  const tickLensArgs = new Array(maxIndex - minIndex + 1)
    .fill(0)
    .map((_, i) => i + minIndex)
    .map((wordIndex) => [poolAddress, wordIndex])

  console.log('tickLensArgs', tickLensArgs)

  const getPopulatedTicksInWordCalls = tickLensArgs.map((lensArgs) =>
    lensContract.getPopulatedTicksInWord(lensArgs[0] as string, lensArgs[1] as number)
  )
  const ticks = (await Promise.all(getPopulatedTicksInWordCalls))
    .flatMap((ticksFromCall) => ticksFromCall)
    .map((data) => ({
      index: data.tick,
      liquidityNet: data.liquidityNet.toString(),
      liquidityGross: data.liquidityGross.toString(),
    }))
  console.log('ticks', ticks)
  const pool = new Pool(
    tokenIn,
    USDC_MAINNET,
    FeeAmount.LOW,
    sqrtPriceX96.toString(),
    liquidity.toString(),
    tick,
    ticks
  )

  // Create a route with a single pool
  const route = new Route([pool], tokenIn, tokenOut)

  // Create a trade instance
  const trade = await Trade.exactIn(route, CurrencyAmount.fromRawAmount(tokenIn, amountIn))

  // Calculate the slippage amount
  const slippageFraction = new Fraction(slippagePercent.toString(), '100')
  const slippageTolerance = new Percent(slippageFraction.numerator, slippageFraction.denominator)

  // Calculate the minimum output amount considering the slippage tolerance
  const minimumOutputAmount = trade.minimumAmountOut(slippageTolerance)

  return parseUnits(minimumOutputAmount.toFixed(tokenOut.decimals), tokenOut.decimals)
}
