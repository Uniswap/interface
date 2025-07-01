import { PartialMessage } from '@bufbuild/protobuf'
import { parseEther } from '@ethersproject/units'
import { UseQueryResult } from '@tanstack/react-query'
import { ListPositionsRequest } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { CHAIN_TO_ADDRESSES_MAP, Percent, Token } from '@uniswap/sdk-core'
import IUniswapV3FactoryABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Factory.sol/IUniswapV3Factory.json'
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { FeeAmount, MintOptions, NonfungiblePositionManager, Pool, Position as SDKPosition } from '@uniswap/v3-sdk'
import { useEffect, useReducer } from 'react'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { createPublicClient, defineTransaction, defineTransactionRequest, encodeFunctionData, http } from 'viem'
import { publicActionsL1 } from 'viem/zksync'
import {
  CheckApprovalLPRequest,
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  DecreaseLPPositionRequest,
  DecreaseLPPositionResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  IndependentToken,
} from '../../tradingApi/__generated__'

const chainInfo = getChainInfo(UniverseChainId.SmartBCH)

const client = createPublicClient({
  chain: {
    ...chainInfo,
    formatters: {
      transaction: defineTransaction({
        exclude: ['type'],
        format: () => {},
      }),
      transactionRequest: defineTransactionRequest({
        exclude: ['type'],
        format: () => {},
      }),
    },
  },
  transport: http(),
}).extend(publicActionsL1())

export enum TradingApiReplicaRequests {
  CREATE_LP_POSITION,
  CHECK_LP_APPROVAL,
  LIST_POSITIONS,
  INCREASE_LP_POSITION,
  DECREASE_LP_POSITION,
  CLAIM_LP_FEES,
}

enum ActionType {
  RESULT,
  ERROR,
  INIT,
}

export interface ListPositionsResponse {
  positions: PositionReplica[]
}

type Response =
  | CreateLPPositionResponse
  | CheckApprovalLPResponse
  | ListPositionsResponse
  | IncreaseLPPositionResponse
  | DecreaseLPPositionResponse
  | ClaimLPFeesResponse

interface InitAction {
  type: ActionType.INIT
}

interface ResponseAction {
  type: ActionType.RESULT
  value: Response
}

interface ErrorAction {
  type: ActionType.ERROR
  value: UseQueryResult['error']
}

type Action = ResponseAction | ErrorAction | InitAction

type State<T = Response> = Pick<UseQueryResult<T>, 'data' | 'error' | 'isLoading'>

export type TradingReplicaResult<T> = Pick<UseQueryResult<T>, 'data' | 'error' | 'isLoading'>

const initialState: State = {
  data: undefined,
  error: null,
  isLoading: true,
}

interface CreateLpPositionParams {
  request: TradingApiReplicaRequests.CREATE_LP_POSITION
  params?: CreateLPPositionRequest
}

interface IncreaseLpPositionParams {
  request: TradingApiReplicaRequests.INCREASE_LP_POSITION
  params?: IncreaseLPPositionRequest
}

interface DecreaseLpPositionParams {
  request: TradingApiReplicaRequests.DECREASE_LP_POSITION
  params?: DecreaseLPPositionRequest
}

interface CheckApprovalLPParams {
  request: TradingApiReplicaRequests.CHECK_LP_APPROVAL
  params?: CreateLPPositionRequest
}

interface ClaimLpFeesParams {
  request: TradingApiReplicaRequests.CLAIM_LP_FEES
  params?: ClaimLPFeesRequest
}

interface ListPositionsParams {
  request: TradingApiReplicaRequests.LIST_POSITIONS
  params?: PartialMessage<ListPositionsRequest>
}

type Params = (
  | CreateLpPositionParams
  | CheckApprovalLPParams
  | ListPositionsParams
  | IncreaseLpPositionParams
  | DecreaseLpPositionParams
  | ClaimLpFeesParams
) & {
  skip?: boolean
}

type PositionContractResponse = [
  BigInt,
  string,
  string,
  string,
  number,
  number,
  number,
  BigInt,
  BigInt,
  BigInt,
  BigInt,
  BigInt,
]

export interface PositionReplica {
  nonce: BigInt
  operator: string
  token0: string
  token1: string
  fee: number
  tickLower: number
  tickUpper: number
  liquidity: BigInt
  feeGrowthInside0LastX128: BigInt
  feeGrowthInside1LastX128: BigInt
  tokensOwed0: BigInt
  tokensOwed1: BigInt
}

const POOL_INITIALIZER_ABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_factory',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_WETH9',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_tokenDescriptor_',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'approved',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    name: 'Collect',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    name: 'DecreaseLiquidity',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    name: 'IncreaseLiquidity',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PERMIT_TYPEHASH',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'WETH9',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'baseURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'recipient',
            type: 'address',
          },
          {
            internalType: 'uint128',
            name: 'amount0Max',
            type: 'uint128',
          },
          {
            internalType: 'uint128',
            name: 'amount1Max',
            type: 'uint128',
          },
        ],
        internalType: 'struct INonfungiblePositionManager.CollectParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'collect',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token0',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token1',
        type: 'address',
      },
      {
        internalType: 'uint24',
        name: 'fee',
        type: 'uint24',
      },
      {
        internalType: 'uint160',
        name: 'sqrtPriceX96',
        type: 'uint160',
      },
    ],
    name: 'createAndInitializePoolIfNecessary',
    outputs: [
      {
        internalType: 'address',
        name: 'pool',
        type: 'address',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256',
          },
          {
            internalType: 'uint128',
            name: 'liquidity',
            type: 'uint128',
          },
          {
            internalType: 'uint256',
            name: 'amount0Min',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount1Min',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'deadline',
            type: 'uint256',
          },
        ],
        internalType: 'struct INonfungiblePositionManager.DecreaseLiquidityParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'decreaseLiquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'getApproved',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'tokenId',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount0Desired',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount1Desired',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount0Min',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount1Min',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'deadline',
            type: 'uint256',
          },
        ],
        internalType: 'struct INonfungiblePositionManager.IncreaseLiquidityParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'increaseLiquidity',
    outputs: [
      {
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
    ],
    name: 'isApprovedForAll',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: 'address',
            name: 'token0',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'token1',
            type: 'address',
          },
          {
            internalType: 'uint24',
            name: 'fee',
            type: 'uint24',
          },
          {
            internalType: 'int24',
            name: 'tickLower',
            type: 'int24',
          },
          {
            internalType: 'int24',
            name: 'tickUpper',
            type: 'int24',
          },
          {
            internalType: 'uint256',
            name: 'amount0Desired',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount1Desired',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount0Min',
            type: 'uint256',
          },
          {
            internalType: 'uint256',
            name: 'amount1Min',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'recipient',
            type: 'address',
          },
          {
            internalType: 'uint256',
            name: 'deadline',
            type: 'uint256',
          },
        ],
        internalType: 'struct INonfungiblePositionManager.MintParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'mint',
    outputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        internalType: 'uint256',
        name: 'amount0',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount1',
        type: 'uint256',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes[]',
        name: 'data',
        type: 'bytes[]',
      },
    ],
    name: 'multicall',
    outputs: [
      {
        internalType: 'bytes[]',
        name: 'results',
        type: 'bytes[]',
      },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'ownerOf',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'positions',
    outputs: [
      {
        internalType: 'uint96',
        name: 'nonce',
        type: 'uint96',
      },
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token0',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'token1',
        type: 'address',
      },
      {
        internalType: 'uint24',
        name: 'fee',
        type: 'uint24',
      },
      {
        internalType: 'int24',
        name: 'tickLower',
        type: 'int24',
      },
      {
        internalType: 'int24',
        name: 'tickUpper',
        type: 'int24',
      },
      {
        internalType: 'uint128',
        name: 'liquidity',
        type: 'uint128',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside0LastX128',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'feeGrowthInside1LastX128',
        type: 'uint256',
      },
      {
        internalType: 'uint128',
        name: 'tokensOwed0',
        type: 'uint128',
      },
      {
        internalType: 'uint128',
        name: 'tokensOwed1',
        type: 'uint128',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'refundETH',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: '_data',
        type: 'bytes',
      },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'selfPermit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expiry',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'selfPermitAllowed',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'nonce',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'expiry',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'selfPermitAllowedIfNecessary',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'value',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'deadline',
        type: 'uint256',
      },
      {
        internalType: 'uint8',
        name: 'v',
        type: 'uint8',
      },
      {
        internalType: 'bytes32',
        name: 'r',
        type: 'bytes32',
      },
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'selfPermitIfNecessary',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'operator',
        type: 'address',
      },
      {
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'token',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'amountMinimum',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
    ],
    name: 'sweepToken',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'tokenByIndex',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256',
      },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'tokenURI',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'from',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'to',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'tokenId',
        type: 'uint256',
      },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amount0Owed',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount1Owed',
        type: 'uint256',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'uniswapV3MintCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'amountMinimum',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
    ],
    name: 'unwrapWETH9',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    stateMutability: 'payable',
    type: 'receive',
  },
]

const POSITION_MANAGER_ABI = [
  {
    inputs: [
      { internalType: 'address', name: '_factory', type: 'address' },
      { internalType: 'address', name: '_WETH9', type: 'address' },
      { internalType: 'address', name: '_tokenDescriptor_', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'approved', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Approval',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'owner', type: 'address' },
      { indexed: true, internalType: 'address', name: 'operator', type: 'address' },
      { indexed: false, internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'ApprovalForAll',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'address', name: 'recipient', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    name: 'Collect',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint128', name: 'liquidity', type: 'uint128' },
      { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    name: 'DecreaseLiquidity',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { indexed: false, internalType: 'uint128', name: 'liquidity', type: 'uint128' },
      { indexed: false, internalType: 'uint256', name: 'amount0', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    name: 'IncreaseLiquidity',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'from', type: 'address' },
      { indexed: true, internalType: 'address', name: 'to', type: 'address' },
      { indexed: true, internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'Transfer',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'PERMIT_TYPEHASH',
    outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'WETH9',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'baseURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'burn',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint128', name: 'amount0Max', type: 'uint128' },
          { internalType: 'uint128', name: 'amount1Max', type: 'uint128' },
        ],
        internalType: 'struct INonfungiblePositionManager.CollectParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'collect',
    outputs: [
      { internalType: 'uint256', name: 'amount0', type: 'uint256' },
      { internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token0', type: 'address' },
      { internalType: 'address', name: 'token1', type: 'address' },
      { internalType: 'uint24', name: 'fee', type: 'uint24' },
      { internalType: 'uint160', name: 'sqrtPriceX96', type: 'uint160' },
    ],
    name: 'createAndInitializePoolIfNecessary',
    outputs: [{ internalType: 'address', name: 'pool', type: 'address' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
          { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
          { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        internalType: 'struct INonfungiblePositionManager.DecreaseLiquidityParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'decreaseLiquidity',
    outputs: [
      { internalType: 'uint256', name: 'amount0', type: 'uint256' },
      { internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'factory',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'getApproved',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
          { internalType: 'uint256', name: 'amount0Desired', type: 'uint256' },
          { internalType: 'uint256', name: 'amount1Desired', type: 'uint256' },
          { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
          { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        internalType: 'struct INonfungiblePositionManager.IncreaseLiquidityParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'increaseLiquidity',
    outputs: [
      { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
      { internalType: 'uint256', name: 'amount0', type: 'uint256' },
      { internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address', name: 'operator', type: 'address' },
    ],
    name: 'isApprovedForAll',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        components: [
          { internalType: 'address', name: 'token0', type: 'address' },
          { internalType: 'address', name: 'token1', type: 'address' },
          { internalType: 'uint24', name: 'fee', type: 'uint24' },
          { internalType: 'int24', name: 'tickLower', type: 'int24' },
          { internalType: 'int24', name: 'tickUpper', type: 'int24' },
          { internalType: 'uint256', name: 'amount0Desired', type: 'uint256' },
          { internalType: 'uint256', name: 'amount1Desired', type: 'uint256' },
          { internalType: 'uint256', name: 'amount0Min', type: 'uint256' },
          { internalType: 'uint256', name: 'amount1Min', type: 'uint256' },
          { internalType: 'address', name: 'recipient', type: 'address' },
          { internalType: 'uint256', name: 'deadline', type: 'uint256' },
        ],
        internalType: 'struct INonfungiblePositionManager.MintParams',
        name: 'params',
        type: 'tuple',
      },
    ],
    name: 'mint',
    outputs: [
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
      { internalType: 'uint256', name: 'amount0', type: 'uint256' },
      { internalType: 'uint256', name: 'amount1', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes[]', name: 'data', type: 'bytes[]' }],
    name: 'multicall',
    outputs: [{ internalType: 'bytes[]', name: 'results', type: 'bytes[]' }],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'ownerOf',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'spender', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'positions',
    outputs: [
      { internalType: 'uint96', name: 'nonce', type: 'uint96' },
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'address', name: 'token0', type: 'address' },
      { internalType: 'address', name: 'token1', type: 'address' },
      { internalType: 'uint24', name: 'fee', type: 'uint24' },
      { internalType: 'int24', name: 'tickLower', type: 'int24' },
      { internalType: 'int24', name: 'tickUpper', type: 'int24' },
      { internalType: 'uint128', name: 'liquidity', type: 'uint128' },
      { internalType: 'uint256', name: 'feeGrowthInside0LastX128', type: 'uint256' },
      { internalType: 'uint256', name: 'feeGrowthInside1LastX128', type: 'uint256' },
      { internalType: 'uint128', name: 'tokensOwed0', type: 'uint128' },
      { internalType: 'uint128', name: 'tokensOwed1', type: 'uint128' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  { inputs: [], name: 'refundETH', outputs: [], stateMutability: 'payable', type: 'function' },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
      { internalType: 'bytes', name: '_data', type: 'bytes' },
    ],
    name: 'safeTransferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' },
    ],
    name: 'selfPermit',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'nonce', type: 'uint256' },
      { internalType: 'uint256', name: 'expiry', type: 'uint256' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' },
    ],
    name: 'selfPermitAllowed',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'nonce', type: 'uint256' },
      { internalType: 'uint256', name: 'expiry', type: 'uint256' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' },
    ],
    name: 'selfPermitAllowedIfNecessary',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'value', type: 'uint256' },
      { internalType: 'uint256', name: 'deadline', type: 'uint256' },
      { internalType: 'uint8', name: 'v', type: 'uint8' },
      { internalType: 'bytes32', name: 'r', type: 'bytes32' },
      { internalType: 'bytes32', name: 's', type: 'bytes32' },
    ],
    name: 'selfPermitIfNecessary',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'operator', type: 'address' },
      { internalType: 'bool', name: 'approved', type: 'bool' },
    ],
    name: 'setApprovalForAll',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'token', type: 'address' },
      { internalType: 'uint256', name: 'amountMinimum', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'sweepToken',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'index', type: 'uint256' }],
    name: 'tokenByIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'uint256', name: 'index', type: 'uint256' },
    ],
    name: 'tokenOfOwnerByIndex',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'address', name: 'from', type: 'address' },
      { internalType: 'address', name: 'to', type: 'address' },
      { internalType: 'uint256', name: 'tokenId', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amount0Owed', type: 'uint256' },
      { internalType: 'uint256', name: 'amount1Owed', type: 'uint256' },
      { internalType: 'bytes', name: 'data', type: 'bytes' },
    ],
    name: 'uniswapV3MintCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: 'amountMinimum', type: 'uint256' },
      { internalType: 'address', name: 'recipient', type: 'address' },
    ],
    name: 'unwrapWETH9',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  { stateMutability: 'payable', type: 'receive' },
]

const listPositions = async (params: PartialMessage<ListPositionsRequest>): Promise<ListPositionsResponse> => {
  const balance = (await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as unknown as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'balanceOf',
    args: [params.address],
  })) as BigInt
  const tokenIds = []
  for (let i = 0; i < Number(balance); i++) {
    const tokenId = await client.readContract({
      address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as unknown as `0x${string}`,
      abi: POSITION_MANAGER_ABI,
      functionName: 'tokenOfOwnerByIndex',
      args: [params.address, i],
    })
    tokenIds.push(tokenId)
  }
  const positions: PositionReplica[] = []
  for (const tokenId of tokenIds) {
    const position = (await client.readContract({
      address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as unknown as `0x${string}`,
      abi: POSITION_MANAGER_ABI,
      functionName: 'positions',
      args: [tokenId],
    })) as PositionContractResponse
    positions.push({
      nonce: position[0],
      operator: position[1],
      token0: position[2],
      token1: position[3],
      fee: position[4],
      tickLower: position[5],
      tickUpper: position[6],
      liquidity: position[7],
      feeGrowthInside0LastX128: position[8],
      feeGrowthInside1LastX128: position[9],
      tokensOwed0: position[10],
      tokensOwed1: position[11],
    })
  }
  return {
    positions,
  }
}

const createLpPosition = async (params: CreateLPPositionRequest): Promise<CreateLPPositionResponse> => {
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

const increaseLpPosition = async (params: IncreaseLPPositionRequest): Promise<IncreaseLPPositionResponse> => {
  if (params.tokenId == null) {
    throw new Error('tokenId must be defined')
  }
  // Get current position data from the Position Manager contract
  const currentPosition = await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'positions',
    args: [params.tokenId as unknown as string],
  })

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

  // Alternative approach using direct contract call
  // If the SDK method doesn't work as expected, use this:
  /*
  const calldata = encodeFunctionData({
    abi: [{
      name: 'increaseLiquidity',
      type: 'function',
      inputs: [
        {
          name: 'params',
          type: 'tuple',
          components: [
            { name: 'tokenId', type: 'uint256' },
            { name: 'amount0Desired', type: 'uint256' },
            { name: 'amount1Desired', type: 'uint256' },
            { name: 'amount0Min', type: 'uint256' },
            { name: 'amount1Min', type: 'uint256' },
            { name: 'deadline', type: 'uint256' }
          ]
        }
      ],
      outputs: [
        { name: 'liquidity', type: 'uint128' },
        { name: 'amount0', type: 'uint256' },
        { name: 'amount1', type: 'uint256' }
      ]
    }],
    functionName: 'increaseLiquidity',
    args: [{
      tokenId: params.tokenId,
      amount0Desired: additionalPosition.amount0.quotient.toString(),
      amount1Desired: additionalPosition.amount1.quotient.toString(),
      amount0Min: additionalPosition.amount0.multiply(new Percent(9950, 10000)).quotient.toString(),
      amount1Min: additionalPosition.amount1.multiply(new Percent(9950, 10000)).quotient.toString(),
      deadline: params.deadline ?? Math.floor(Date.now() / 1000) + 60 * 20,
    }],
  })
  */

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

const decreaseLpPosition = async (params: DecreaseLPPositionRequest): Promise<DecreaseLPPositionResponse> => {
  console.log({ params })
  if (params.tokenId == null) {
    throw new Error('tokenId must be defined')
  }

  // Get current position data from the Position Manager contract
  const currentPosition = await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'positions',
    args: [params.tokenId as unknown as string],
  })

  // Extract position data
  const [nonce, operator, token0Address, token1Address, fee, tickLower, tickUpper, currentLiquidity] = currentPosition

  // Validate that position has liquidity
  if (BigInt(currentLiquidity) === BigInt(0)) {
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
    liquidityToRemove = (currentLiquidity * BigInt(Math.floor(params.liquidityPercentageToDecrease * 100))) / 10000n
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

const checkLpApproval = async (params: CheckApprovalLPRequest): Promise<CheckApprovalLPResponse> => {
  const response: CheckApprovalLPResponse = {
    requestId: 'whatever', // Generate a request ID if not provided
    token0Approval: undefined,
    token1Approval: undefined,
    token0Cancel: undefined,
    token1Cancel: undefined,
    positionTokenApproval: undefined,
    permitData: undefined,
    gasFeeToken0Approval: '0',
    gasFeeToken1Approval: '0',
    gasFeePositionTokenApproval: '0',
    gasFeeToken0Cancel: '0',
    gasFeeToken1Cancel: '0',
  }
  if (params.token0) {
    if (isNativeCurrencyAddress(UniverseChainId.SmartBCH, params.token0)) {
      response.token0Approval = undefined
    } else {
      const isApproved = await client.getL1Allowance({
        account: params.walletAddress! as `0x${string}`,
        token: params.token0! as `0x${string}`,
        bridgeAddress: CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH]
          .nonfungiblePositionManagerAddress as `0x${string}`,
      })
      response.token0Approval =
        isApproved < BigInt(params.amount0 ?? 0)
          ? await client.prepareTransactionRequest({
              account: params.walletAddress! as `0x${string}`,
              to: params.token0! as `0x${string}`,
              data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [
                  CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH].nonfungiblePositionManagerAddress,
                  parseEther(Number.MAX_SAFE_INTEGER.toString()).toString(),
                ],
              }),
            })
          : undefined
    }
  }

  if (params.token1) {
    if (isNativeCurrencyAddress(UniverseChainId.SmartBCH, params.token1)) {
      response.token1Approval = undefined
    } else {
      const isApproved = await client.getL1Allowance({
        account: params.walletAddress! as `0x${string}`,
        token: params.token1! as `0x${string}`,
        bridgeAddress: CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH]
          .nonfungiblePositionManagerAddress as `0x${string}`,
      })
      response.token1Approval =
        isApproved < BigInt(params.amount0 ?? 0)
          ? await client.prepareTransactionRequest({
              account: params.walletAddress! as `0x${string}`,
              to: params.token1! as `0x${string}`,
              data: encodeFunctionData({
                abi: ERC20_ABI,
                functionName: 'approve',
                args: [
                  CHAIN_TO_ADDRESSES_MAP[UniverseChainId.SmartBCH].nonfungiblePositionManagerAddress,
                  parseEther(Number.MAX_SAFE_INTEGER.toString()).toString(),
                ],
              }),
            })
          : undefined
    }
  }
  // Additional logic for position token approval and gas fees can be added here

  return response
}

const claimLpFees = async (params: ClaimLPFeesRequest): Promise<ClaimLPFeesResponse> => {
  if (params.tokenId == null) {
    throw new Error('tokenId must be defined')
  }

  if (params.walletAddress == null) {
    throw new Error('Wallet address must be defined')
  }

  // Get current position data from the Position Manager contract
  const currentPosition = await client.readContract({
    address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as `0x${string}`,
    abi: POSITION_MANAGER_ABI,
    functionName: 'positions',
    args: [params.tokenId as unknown as string],
  })

  // Extract position data
  const [
    nonce,
    operator,
    token0Address,
    token1Address,
    fee,
    tickLower,
    tickUpper,
    currentLiquidity,
    feeGrowthInside0LastX128,
    feeGrowthInside1LastX128,
    tokensOwed0,
    tokensOwed1,
  ] = currentPosition

  // Validate that there are fees to collect
  if (tokensOwed0 === 0n && tokensOwed1 === 0n) {
    throw new Error('No fees available to collect')
  }

  // Optional validation against expected amounts
  if (params.expectedTokenOwed0RawAmount != null && tokensOwed0.toString() !== params.expectedTokenOwed0RawAmount) {
    console.warn(
      `Token0 fees mismatch. Expected: ${params.expectedTokenOwed0RawAmount}, Actual: ${tokensOwed0.toString()}`,
    )
  }

  if (params.expectedTokenOwed1RawAmount != null && tokensOwed1.toString() !== params.expectedTokenOwed1RawAmount) {
    console.warn(
      `Token1 fees mismatch. Expected: ${params.expectedTokenOwed1RawAmount}, Actual: ${tokensOwed1.toString()}`,
    )
  }

  // Prepare collect parameters
  const collectParams = {
    tokenId: params.tokenId,
    recipient: params.walletAddress,
    amount0Max: tokensOwed0, // Collect all available fees for token0
    amount1Max: tokensOwed1, // Collect all available fees for token1
  }

  let calldata: `0x${string}`
  let value: bigint = 0n

  if (params.collectAsWETH) {
    // Use collectAsWETH if one of the tokens is WETH and user wants to collect as WETH
    // First check if either token is WETH
    const WETH_ADDRESS = chainInfo.wrappedNativeCurrency.address as `0x${string}`
    const isToken0WETH = token0Address.toLowerCase() === WETH_ADDRESS.toLowerCase()
    const isToken1WETH = token1Address.toLowerCase() === WETH_ADDRESS.toLowerCase()

    if (isToken0WETH || isToken1WETH) {
      // Use multicall to collect and unwrap WETH
      const collectCalldata = encodeFunctionData({
        abi: [
          {
            name: 'collect',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                  { name: 'amount0Max', type: 'uint128' },
                  { name: 'amount1Max', type: 'uint128' },
                ],
              },
            ],
            outputs: [
              { name: 'amount0', type: 'uint256' },
              { name: 'amount1', type: 'uint256' },
            ],
          },
        ],
        functionName: 'collect',
        args: [collectParams],
      })

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
        args: [isToken0WETH ? tokensOwed0 : tokensOwed1, params.walletAddress],
      })

      calldata = encodeFunctionData({
        abi: [
          {
            name: 'multicall',
            type: 'function',
            inputs: [{ name: 'data', type: 'bytes[]' }],
            outputs: [{ name: 'results', type: 'bytes[]' }],
          },
        ],
        functionName: 'multicall',
        args: [[collectCalldata, unwrapCalldata]],
      })
    } else {
      // Neither token is WETH, fallback to regular collect
      calldata = encodeFunctionData({
        abi: [
          {
            name: 'collect',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                  { name: 'amount0Max', type: 'uint128' },
                  { name: 'amount1Max', type: 'uint128' },
                ],
              },
            ],
            outputs: [
              { name: 'amount0', type: 'uint256' },
              { name: 'amount1', type: 'uint256' },
            ],
          },
        ],
        functionName: 'collect',
        args: [collectParams],
      })
    }
  } else {
    // Standard collect function
    calldata = encodeFunctionData({
      abi: [
        {
          name: 'collect',
          type: 'function',
          inputs: [
            {
              name: 'params',
              type: 'tuple',
              components: [
                { name: 'tokenId', type: 'uint256' },
                { name: 'recipient', type: 'address' },
                { name: 'amount0Max', type: 'uint128' },
                { name: 'amount1Max', type: 'uint128' },
              ],
            },
          ],
          outputs: [
            { name: 'amount0', type: 'uint256' },
            { name: 'amount1', type: 'uint256' },
          ],
        },
      ],
      functionName: 'collect',
      args: [collectParams],
    })
  }

  // Prepare the transaction request
  const transactionRequest = await client.prepareTransactionRequest({
    data: calldata,
    to: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress,
    value: value,
    from: params.walletAddress,
    gas: 200000, // Collecting fees typically requires less gas than position management
  })

  let gasFee: string | undefined

  // Simulate transaction if requested
  if (params.simulateTransaction) {
    try {
      const simulationResult = await client.simulateContract({
        address: CHAIN_TO_ADDRESSES_MAP[10000].nonfungiblePositionManagerAddress as `0x${string}`,
        abi: [
          {
            name: 'collect',
            type: 'function',
            inputs: [
              {
                name: 'params',
                type: 'tuple',
                components: [
                  { name: 'tokenId', type: 'uint256' },
                  { name: 'recipient', type: 'address' },
                  { name: 'amount0Max', type: 'uint128' },
                  { name: 'amount1Max', type: 'uint128' },
                ],
              },
            ],
            outputs: [
              { name: 'amount0', type: 'uint256' },
              { name: 'amount1', type: 'uint256' },
            ],
          },
        ],
        functionName: 'collect',
        args: [collectParams],
        account: params.walletAddress,
      })

      // Calculate gas fee estimate
      const gasPrice = await client.getGasPrice()
      gasFee = (BigInt(transactionRequest.gas!) * gasPrice).toString()
    } catch (error) {
      console.warn('Transaction simulation failed:', error)
    }
  }

  return {
    claim: transactionRequest,
    gasFee,
  }
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.RESULT:
      return {
        ...state,
        error: null,
        isLoading: false,
        data: action.value,
      }
    case ActionType.ERROR:
      return {
        ...state,
        isLoading: false,
        error: action.value,
      }
    case ActionType.INIT:
      return {
        data: undefined,
        isLoading: true,
        error: null,
      }
    default:
      return state
  }
}

const useTradingApiReplica = (params: Params) => {
  const [state, dispatch] = useReducer(reducer, { ...initialState, isLoading: params.skip !== true })
  useEffect(() => {
    ;(async () => {
      if (params.params == null || params.skip === true) return
      dispatch({
        type: ActionType.INIT,
      })
      try {
        let value: Response
        switch (params.request) {
          case TradingApiReplicaRequests.LIST_POSITIONS:
            value = await listPositions(params.params)
            break
          case TradingApiReplicaRequests.CHECK_LP_APPROVAL:
            value = await checkLpApproval(params.params)
            break
          case TradingApiReplicaRequests.CLAIM_LP_FEES:
            value = await claimLpFees(params.params)
            break
          case TradingApiReplicaRequests.CREATE_LP_POSITION:
            value = await createLpPosition(params.params)
            break
          case TradingApiReplicaRequests.INCREASE_LP_POSITION:
            value = await increaseLpPosition(params.params)
            break
          case TradingApiReplicaRequests.DECREASE_LP_POSITION:
            value = await decreaseLpPosition(params.params)
            break
        }
        dispatch({
          type: ActionType.RESULT,
          value,
        })
      } catch (e: unknown) {
        dispatch({
          type: ActionType.ERROR,
          value: e,
        })
      }
    })()
  }, [params.request, params.skip, JSON.stringify(params.params)])
  return state
}

export default useTradingApiReplica
