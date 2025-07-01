import { PartialMessage } from '@bufbuild/protobuf'
import { UseQueryResult } from '@tanstack/react-query'
import { ListPositionsRequest } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { useEffect, useReducer } from 'react'

import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { createPublicClient, defineTransaction, defineTransactionRequest, http } from 'viem'
import { publicActionsL1 } from 'viem/zksync'
import {
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  DecreaseLPPositionRequest,
  DecreaseLPPositionResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
} from '../../../tradingApi/__generated__'

import { checkLpApproval } from './handlers/checkLpApproval'
import { claimLpFees } from './handlers/claimLpFees'
import { createLpPosition } from './handlers/createLpPosition'
import { decreaseLpPosition } from './handlers/decreaseLpPosition'
import { increaseLpPosition } from './handlers/increaseLpPosition'

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

type Response =
  | CreateLPPositionResponse
  | CheckApprovalLPResponse
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
