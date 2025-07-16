import { CHAIN_TO_ADDRESSES_MAP, Percent, Token } from '@uniswap/sdk-core'
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount, NonfungiblePositionManager, Pool, Position as SDKPosition } from '@uniswap/v3-sdk'
import { DecreaseLPPositionRequest, DecreaseLPPositionResponse } from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { POSITION_MANAGER_ABI } from '../abi'
import { client } from '../client'
import { PositionContractResponse } from '../constants'

export const decreaseLpPosition = async (params: DecreaseLPPositionRequest): Promise<DecreaseLPPositionResponse> => {
  console.log({ params })
  if (params.tokenId == null) {
    throw new Error('tokenId must be defined')
  }

  // Get current position data from the Position Manager contract
  const currentPosition = (await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'positions',
    args: [params.tokenId as unknown as string],
  })) as PositionContractResponse

  // Extract position data
  const [nonce, operator, token0Address, token1Address, fee, tickLower, tickUpper, currentLiquidity] = currentPosition

  // Validate that position has liquidity
  if (currentLiquidity === BigInt(0)) {
    throw new Error('Position has no liquidity to decrease')
  }

  // Get token decimals
  const [token0Decimals, token1Decimals] = await Promise.all([
    client.readContract({
      address: token0Address as `0x${string}`,
      abi: [{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }],
      functionName: 'decimals',
    }),
    client.readContract({
      address: token1Address as `0x${string}`,
      abi: [{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }],
      functionName: 'decimals',
    }),
  ])

  // Create token instances
  const token0 = new Token(UniverseChainId.SmartBCH, token0Address, token0Decimals)
  const token1 = new Token(UniverseChainId.SmartBCH, token1Address, token1Decimals)

  // Get pool address
  const poolAddress = await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].v3CoreFactoryAddress as `0x${string}`,
    abi: IUniswapV3FactoryABI.abi,
    functionName: 'getPool',
    args: [token0Address, token1Address, fee],
  })

  if (poolAddress === '0x0000000000000000000000000000000000000000') {
    throw new Error('Pool does not exist')
  }

  // Get current pool state
  const [liquidity, slot0] = await Promise.all([
    client.readContract({
      address: poolAddress as `0x${string}`,
      abi: IUniswapV3PoolABI.abi,
      functionName: 'liquidity',
    }) as Promise<BigInt>,
    client.readContract({
      address: poolAddress as `0x${string}`,
      abi: IUniswapV3PoolABI.abi,
      functionName: 'slot0',
    }) as Promise<[number, number, number, number, number, number, boolean]>,
  ])

  // Create pool instance
  const configuredPool = new Pool(token0, token1, fee as FeeAmount, slot0[0].toString(), liquidity.toString(), slot0[1])

  // Create current position instance
  const currentPositionSDK = new SDKPosition({
    pool: configuredPool,
    liquidity: currentLiquidity.toString(),
    tickLower: tickLower,
    tickUpper: tickUpper,
  })

  // Calculate liquidity to remove
  let liquidityToRemove: BigInt

  if (params.liquidityPercentageToDecrease != null) {
    // Remove percentage of current liquidity
    if (params.liquidityPercentageToDecrease < 0 || params.liquidityPercentageToDecrease > 100) {
      throw new Error('Liquidity percentage must be between 0 and 100')
    }
    liquidityToRemove =
      (currentLiquidity.valueOf() * BigInt(Math.floor(params.liquidityPercentageToDecrease * 100))) /
      BigInt(10000).valueOf()
  } else if (params.positionLiquidity != null) {
    // Remove specific amount of liquidity
    liquidityToRemove = BigInt(params.positionLiquidity)
    if (liquidityToRemove > currentLiquidity) {
      throw new Error('Cannot remove more liquidity than available in position')
    }
  } else {
    throw new Error('Either liquidityPercentage or liquidityAmount must be specified')
  }

  if (liquidityToRemove.valueOf() <= BigInt(0)) {
    throw new Error('Liquidity to remove must be greater than 0')
  }

  if (params.walletAddress == null) {
    throw new Error('Wallet address must be defined')
  }

  // Calculate expected token amounts from liquidity removal
  const positionToRemove = new SDKPosition({
    pool: configuredPool,
    liquidity: liquidityToRemove.toString(),
    tickLower: tickLower,
    tickUpper: tickUpper,
  })

  // Prepare decrease liquidity options
  const decreaseLiquidityOptions = {
    tokenId: params.tokenId,
    liquidityPercentage: new Percent(liquidityToRemove.toString(), currentLiquidity.toString()),
    slippageTolerance: new Percent(params.slippageTolerance ?? 50, 10_000),
    deadline: params.deadline ?? Math.floor(Date.now() / 1000) + 60 * 20,
    collectOptions:
      params.collectTokens !== false
        ? {
            expectedCurrencyOwed0: positionToRemove.amount0,
            expectedCurrencyOwed1: positionToRemove.amount1,
            recipient: params.walletAddress,
          }
        : undefined,
  }

  // Get calldata for decreasing liquidity using SDK
  const { calldata, value } = NonfungiblePositionManager.removeCallParameters(
    currentPositionSDK,
    decreaseLiquidityOptions,
  )

  const response: DecreaseLPPositionResponse = {
    decrease: await client.prepareTransactionRequest({
      data: calldata,
      to: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress,
      value: value,
      from: params.walletAddress,
      gas: 500000,
    }),
    expectedAmount0: positionToRemove.amount0.quotient.toString(),
    expectedAmount1: positionToRemove.amount1.quotient.toString(),
    liquidityRemoved: liquidityToRemove.toString(),
  }

  return response
}
