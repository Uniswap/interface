import { CHAIN_TO_ADDRESSES_MAP, Percent, Token } from '@uniswap/sdk-core'
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount, NonfungiblePositionManager, Pool, Position as SDKPosition } from '@uniswap/v3-sdk'
import {
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  IndependentToken,
} from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { POSITION_MANAGER_ABI } from '../abi'
import { client } from '../client'
import { PositionContractResponse } from '../constants'

export const increaseLpPosition = async (params: IncreaseLPPositionRequest): Promise<IncreaseLPPositionResponse> => {
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

  // Calculate additional position based on input amounts
  const positionCommonParams = {
    pool: configuredPool,
    tickLower: tickLower,
    tickUpper: tickUpper,
    useFullPrecision: true,
  }

  const amounts =
    params.independentToken === IndependentToken.TOKEN_0
      ? {
          amount0: params.independentAmount,
          amount1: params.defaultDependentAmount,
        }
      : {
          amount0: params.defaultDependentAmount,
          amount1: params.independentAmount,
        }

  let additionalPosition: SDKPosition | null = null

  if (amounts.amount0 != null && amounts.amount1 != null) {
    additionalPosition = SDKPosition.fromAmounts({
      ...positionCommonParams,
      amount0: amounts.amount0,
      amount1: amounts.amount1,
    })
  } else if (amounts.amount0 != null) {
    additionalPosition = SDKPosition.fromAmount0({
      ...positionCommonParams,
      amount0: amounts.amount0,
    })
  } else if (amounts.amount1 != null) {
    additionalPosition = SDKPosition.fromAmount1({
      ...positionCommonParams,
      amount1: amounts.amount1,
    })
  }

  if (params.walletAddress == null) {
    throw new Error('Wallet address must be defined')
  }

  if (additionalPosition == null) {
    throw new Error('Additional position must be defined')
  }

  // Prepare increase liquidity options
  const increaseLiquidityOptions = {
    tokenId: params.tokenId,
    slippageTolerance: new Percent(50, 10_000),
    deadline: params.deadline ?? Math.floor(Date.now() / 1000) + 60 * 20,
  }

  // Get calldata for increasing liquidity
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(additionalPosition, increaseLiquidityOptions)

  return {
    increase: await client.prepareTransactionRequest({
      data: calldata,
      to: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress,
      value: value,
      from: params.walletAddress,
      gas: 1000000,
    }),
  }
}
