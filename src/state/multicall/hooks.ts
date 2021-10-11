import { FunctionFragment, Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { useActiveWeb3React } from '../../hooks/web3'
import { useBlockNumber } from '../application/hooks'
import { addMulticallListeners, ListenerOptions, removeMulticallListeners } from './actions'
import { Call, parseCallKey, toCallKey } from './utils'

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

type MethodArg = string | number | BigNumber
type MethodArgs = Array<MethodArg | MethodArg[]>

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

function isMethodArg(x: unknown): x is MethodArg {
  return BigNumber.isBigNumber(x) || ['string', 'number'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every((xi) => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}

interface CallResult {
  readonly valid: boolean
  readonly data: string | undefined
  readonly blockNumber: number | undefined
}

const INVALID_RESULT: CallResult = { valid: false, blockNumber: undefined, data: undefined }

// use this options object
export const NEVER_RELOAD: ListenerOptions = {
  blocksPerFetch: Infinity,
}

// the lowest level call for subscribing to contract data
function useCallsData(
  calls: (Call | undefined)[],
  { blocksPerFetch }: ListenerOptions = { blocksPerFetch: 1 }
): CallResult[] {
  const { chainId } = useActiveWeb3React()
  const callResults = useAppSelector((state) => state.multicall.callResults)
  const dispatch = useAppDispatch()

  const serializedCallKeys: string = useMemo(
    () =>
      JSON.stringify(
        calls
          ?.filter((c): c is Call => Boolean(c))
          ?.map(toCallKey)
          ?.sort() ?? []
      ),
    [calls]
  )

  // update listeners when there is an actual change that persists for at least 100ms
  useEffect(() => {
    const callKeys: string[] = JSON.parse(serializedCallKeys)
    if (!chainId || callKeys.length === 0) return undefined
    const calls = callKeys.map((key) => parseCallKey(key))
    dispatch(
      addMulticallListeners({
        chainId,
        calls,
        options: { blocksPerFetch },
      })
    )

    return () => {
      dispatch(
        removeMulticallListeners({
          chainId,
          calls,
          options: { blocksPerFetch },
        })
      )
    }
  }, [chainId, dispatch, blocksPerFetch, serializedCallKeys])

  return useMemo(
    () =>
      calls.map<CallResult>((call) => {
        if (!chainId || !call) return INVALID_RESULT

        const result = callResults[chainId]?.[toCallKey(call)]
        let data
        if (result?.data && result?.data !== '0x') {
          data = result.data
        }

        return { valid: true, data, blockNumber: result?.blockNumber }
      }),
    [callResults, calls, chainId]
  )
}

interface CallState {
  readonly valid: boolean
  // the result, or undefined if loading or errored/no data
  readonly result: Result | undefined
  // true if the result has never been fetched
  readonly loading: boolean
  // true if the result is not for the latest block
  readonly syncing: boolean
  // true if the call was made and is synced, but the return data is invalid
  readonly error: boolean
}

const INVALID_CALL_STATE: CallState = { valid: false, result: undefined, loading: false, syncing: false, error: false }
const LOADING_CALL_STATE: CallState = { valid: true, result: undefined, loading: true, syncing: true, error: false }

function toCallState(
  callResult: CallResult | undefined,
  contractInterface: Interface | undefined,
  fragment: FunctionFragment | undefined,
  latestBlockNumber: number | undefined
): CallState {
  if (!callResult) return INVALID_CALL_STATE
  const { valid, data, blockNumber } = callResult
  if (!valid) return INVALID_CALL_STATE
  if (valid && !blockNumber) return LOADING_CALL_STATE
  if (!contractInterface || !fragment || !latestBlockNumber) return LOADING_CALL_STATE
  const success = data && data.length > 2
  const syncing = (blockNumber ?? 0) < latestBlockNumber
  let result: Result | undefined = undefined
  if (success && data) {
    try {
      result = contractInterface.decodeFunctionResult(fragment, data)
    } catch (error) {
      console.debug('Result data parsing failed', fragment, data)
      return {
        valid: true,
        loading: false,
        error: true,
        syncing,
        result,
      }
    }
  }
  return {
    valid: true,
    loading: false,
    syncing,
    result,
    error: !success,
  }
}

// formats many calls to a single function on a single contract, with the function name and inputs specified
export function useSingleContractMultipleData(
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[],
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState[] {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])

  // encode callDatas
  const callDatas = useMemo(
    () =>
      contract && fragment
        ? callInputs.map<string | undefined>((callInput) =>
            isValidMethodArgs(callInput) ? contract.interface.encodeFunctionData(fragment, callInput) : undefined
          )
        : [],
    [callInputs, contract, fragment]
  )

  const gasRequired = options?.gasRequired
  const blocksPerFetch = options?.blocksPerFetch

  // encode calls
  const calls = useMemo(
    () =>
      contract
        ? callDatas.map<Call | undefined>((callData) =>
            callData
              ? {
                  address: contract.address,
                  callData,
                  gasRequired,
                }
              : undefined
          )
        : [],
    [contract, callDatas, gasRequired]
  )

  const results = useCallsData(calls, blocksPerFetch ? { blocksPerFetch } : undefined)

  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return results.map((result) => toCallState(result, contract?.interface, fragment, latestBlockNumber))
  }, [results, contract, fragment, latestBlockNumber])
}

export function useMultipleContractSingleData(
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState[] {
  const fragment = useMemo(() => contractInterface.getFunction(methodName), [contractInterface, methodName])

  // encode callData
  const callData: string | undefined = useMemo(
    () => (isValidMethodArgs(callInputs) ? contractInterface.encodeFunctionData(fragment, callInputs) : undefined),
    [callInputs, contractInterface, fragment]
  )

  const gasRequired = options?.gasRequired
  const blocksPerFetch = options?.blocksPerFetch

  // encode calls
  const calls = useMemo(
    () =>
      callData
        ? addresses.map<Call | undefined>((address) => {
            return address
              ? {
                  address,
                  callData,
                  gasRequired,
                }
              : undefined
          })
        : [],
    [addresses, callData, gasRequired]
  )

  const results = useCallsData(calls, blocksPerFetch ? { blocksPerFetch } : undefined)

  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return results.map((result) => toCallState(result, contractInterface, fragment, latestBlockNumber))
  }, [fragment, results, contractInterface, latestBlockNumber])
}

export function useSingleCallResult(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState {
  return useSingleContractMultipleData(contract, methodName, [inputs], options)[0] ?? INVALID_CALL_STATE
}

// formats many calls to any number of functions on a single contract, with only the calldata specified
export function useSingleContractWithCallData(
  contract: Contract | null | undefined,
  callDatas: string[],
  options: Partial<ListenerOptions> & { gasRequired?: number } = {}
): CallState[] {
  const gasRequired = options?.gasRequired
  const blocksPerFetch = options?.blocksPerFetch

  // encode calls
  const calls = useMemo(
    () =>
      contract
        ? callDatas.map<Call>((callData) => {
            return {
              address: contract.address,
              callData,
              gasRequired,
            }
          })
        : [],
    [contract, callDatas, gasRequired]
  )

  const results = useCallsData(calls, blocksPerFetch ? { blocksPerFetch } : undefined)

  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return results.map((result, i) =>
      toCallState(
        result,
        contract?.interface,
        contract?.interface?.getFunction(callDatas[i].substring(0, 10)),
        latestBlockNumber
      )
    )
  }, [results, contract, callDatas, latestBlockNumber])
}
