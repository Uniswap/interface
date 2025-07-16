import { PartialMessage } from '@bufbuild/protobuf'
import { UseQueryResult } from '@tanstack/react-query'
import { ListPositionsRequest } from '@uniswap/client-pools/dist/pools/v1/api_pb'
import { useEffect, useReducer } from 'react'

import {
  ApprovalRequest,
  CheckApprovalLPResponse,
  ClaimLPFeesRequest,
  ClaimLPFeesResponse,
  CreateLPPositionRequest,
  CreateLPPositionResponse,
  CreateSwapRequest,
  CreateSwapResponse,
  DecreaseLPPositionRequest,
  DecreaseLPPositionResponse,
  IncreaseLPPositionRequest,
  IncreaseLPPositionResponse,
  QuoteRequest,
} from '../../../tradingApi/__generated__'

import { DiscriminatedQuoteResponse } from '../TradingApiClient'
import { ApprovalResponse, checkApproval } from './handlers/checkApproval'
import { checkLpApproval } from './handlers/checkLpApproval'
import { claimLpFees } from './handlers/claimLpFees'
import { createLpPosition } from './handlers/createLpPosition'
import { decreaseLpPosition } from './handlers/decreaseLpPosition'
import { increaseLpPosition } from './handlers/increaseLpPosition'
import { quote } from './handlers/quote'
import { swap } from './handlers/swap'

export enum TradingApiReplicaRequests {
  CREATE_LP_POSITION,
  CHECK_LP_APPROVAL,
  CHECK_APPROVAL,
  LIST_POSITIONS,
  INCREASE_LP_POSITION,
  DECREASE_LP_POSITION,
  CLAIM_LP_FEES,
  QUOTE,
  SWAP,
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
  | CreateSwapResponse
  | ApprovalResponse
  | DiscriminatedQuoteResponse

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

export type TradingAPIReplicaResult<T> = Pick<UseQueryResult<T>, 'data' | 'error' | 'isLoading'> & {
  refetch: () => Promise<void>
}

const initialState: State = {
  data: undefined,
  error: null,
  isLoading: false,
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

interface CheckApprovalParams {
  request: TradingApiReplicaRequests.CHECK_APPROVAL
  params?: ApprovalRequest
}

interface ClaimLpFeesParams {
  request: TradingApiReplicaRequests.CLAIM_LP_FEES
  params?: ClaimLPFeesRequest
}

interface ListPositionsParams {
  request: TradingApiReplicaRequests.LIST_POSITIONS
  params?: PartialMessage<ListPositionsRequest>
}

interface QuoteParams {
  request: TradingApiReplicaRequests.QUOTE
  params?: QuoteRequest
}

interface SwapParams {
  request: TradingApiReplicaRequests.SWAP
  params?: CreateSwapRequest
}

type Params = (
  | CreateLpPositionParams
  | CheckApprovalLPParams
  | ListPositionsParams
  | IncreaseLpPositionParams
  | DecreaseLpPositionParams
  | ClaimLpFeesParams
  | QuoteParams
  | SwapParams
  | CheckApprovalParams
) & {
  skip?: boolean
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

function serializeParams(params: any): string {
  return JSON.stringify(params, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  })
}

const useTradingApiReplica = <T>(params: Params) => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const run = async (params: Params) => {
    try {
      if (params.params == null || params.skip === true) return
      let value: Response = {}
      switch (params.request) {
        case TradingApiReplicaRequests.CHECK_APPROVAL:
          value = await checkApproval(params.params)
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
        case TradingApiReplicaRequests.QUOTE:
          value = await quote(params.params)
          break
        case TradingApiReplicaRequests.SWAP:
          value = await swap(params.params)
          break
      }
      dispatch({
        type: ActionType.RESULT,
        value,
      })
    } catch (e: unknown) {
      dispatch({
        type: ActionType.ERROR,
        value: e as Error | null,
      })
    }
  }
  useEffect(() => {
    ;(async () => {
      if (params.params == null || params.skip === true) return
      dispatch({
        type: ActionType.INIT,
      })
      await run(params)
    })()
  }, [params.request, params.skip, serializeParams(params.params)])
  console.log('state', state)
  return { ...state, refetch: async () => await run(params) } as TradingAPIReplicaResult<T>
}

export default useTradingApiReplica
