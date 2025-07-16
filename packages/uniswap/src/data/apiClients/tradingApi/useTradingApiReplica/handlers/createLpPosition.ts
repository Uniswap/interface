import { CHAIN_TO_ADDRESSES_MAP, Percent, Token } from '@uniswap/sdk-core'
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount, MintOptions, NonfungiblePositionManager, Pool, Position as SDKPosition } from '@uniswap/v3-sdk'
import {
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  IndependentToken,
} from 'uniswap/src/data/tradingApi/__generated__'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { encodeFunctionData } from 'viem'
import { POOL_INITIALIZER_ABI } from '../abi'
import { client } from '../client'

export const createLpPosition = async (params: CreateLPPositionRequest): Promise<CreateLPPositionResponse> => {
  const [token0Decimals, token1Decimals] = await Promise.all([
    client.readContract({
      address: params.position?.pool.token0 as `0x${string}`,
      abi: [{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }],
      functionName: 'decimals',
    }),
    client.readContract({
      address: params.position?.pool.token1 as `0x${string}`,
      abi: [{ name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] }],
      functionName: 'decimals',
    }),
  ])

  if (params.position == null) {
    throw new Error('Position must be defined')
  }

  const token0 = new Token(UniverseChainId.SmartBCH, params.position.pool.token0, token0Decimals)

  const token1 = new Token(UniverseChainId.SmartBCH, params.position.pool.token1, token1Decimals)

  let poolAddress = await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].v3CoreFactoryAddress as `0x${string}`,
    abi: IUniswapV3FactoryABI.abi,
    functionName: 'getPool',
    args: [params.position?.pool.token0, params.position?.pool.token1, params.position?.pool.fee],
  })

  if (poolAddress === '0x0000000000000000000000000000000000000000') {
    return {
      create: await client.prepareTransactionRequest({
        from: params.walletAddress! as `0x${string}`,
        to: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress,
        data: encodeFunctionData({
          abi: POOL_INITIALIZER_ABI,
          functionName: 'createAndInitializePoolIfNecessary',
          args: [token0.address, token1.address, params.position?.pool.fee, params.initialPrice],
        }),
        value: 0,
        gas: 10000000,
      }),
      sqrtRatioX96: params.initialPrice,
      gasFee: '0',
    }
  }

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

  const configuredPool = new Pool(
    token0,
    token1,
    params.position.pool.fee as FeeAmount,
    slot0[0].toString(),
    liquidity.toString(),
    slot0[1],
  )

  let position: SDKPosition | null = null

  if (params.position == null) {
    throw new Error('Position must be defined')
  }
  if (params.position?.tickLower == null || params.position?.tickUpper == null) {
    throw new Error('Position tickers must be defined')
  }

  const positionCommonParams = {
    pool: configuredPool,
    tickLower: params.position.tickLower,
    tickUpper: params.position.tickUpper,
    useFullPrecision: true,
  }

  const amounts =
    params.independentToken === IndependentToken.TOKEN_0
      ? {
          amount0: params.independentAmount,
          amount1: params.initialDependentAmount,
        }
      : {
          amount0: params.initialDependentAmount,
          amount1: params.independentAmount,
        }

  if (amounts.amount0 != null && amounts.amount1 != null) {
    position = SDKPosition.fromAmounts({
      ...positionCommonParams,
      amount0: amounts.amount0,
      amount1: amounts.amount1,
    })
  } else if (amounts.amount0 != null) {
    position = SDKPosition.fromAmount0({
      ...positionCommonParams,
      amount0: amounts.amount0,
    })
  } else if (amounts.amount1 != null) {
    position = SDKPosition.fromAmount1({
      ...positionCommonParams,
      amount1: amounts.amount1,
    })
  }

  if (params.walletAddress == null) {
    throw new Error('Wallet address must be defined')
  }

  if (position == null) {
    throw new Error('Position must be defined')
  }

  const mintOptions: MintOptions = {
    recipient: params.walletAddress,
    deadline: params.deadline ?? Math.floor(Date.now() / 1000) + 60 * 20,
    slippageTolerance: new Percent(50, 10_000),
  }

  // get calldata for minting a position
  const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, mintOptions)

  return {
    create: await client.prepareTransactionRequest({
      data: calldata,
      to: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress,
      value: value,
      from: params.walletAddress,
      gas: 1000000,
    }),
  }
}
