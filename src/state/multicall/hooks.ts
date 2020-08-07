import { Interface, FunctionFragment } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'

import {
  addMulticallListeners,
  Call,
  removeMulticallListeners,
  parseCallKey,
  toCallKey,
  ListenerOptions
} from './actions'

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

type MethodArg = string | number | BigNumber
type MethodArgs = Array<MethodArg | MethodArg[]>

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

function isMethodArg(x: unknown): x is MethodArg {
  return ['string', 'number'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined || (Array.isArray(x) && x.every(y => isMethodArg(y) || (Array.isArray(y) && y.every(isMethodArg))))
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
  blocksPerFetch: Infinity
}

// the lowest level call for subscribing to contract data
function useCallsData(calls: (Call | undefined)[], options?: ListenerOptions): CallResult[] {
  const { chainId } = useActiveWeb3React()
  const callResults = useSelector<AppState, AppState['multicall']['callResults']>(state => state.multicall.callResults)
  const dispatch = useDispatch<AppDispatch>()

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
    if (!chainId || callKeys.length === 0) return
    const calls = callKeys.map(key => parseCallKey(key))
    dispatch(
      addMulticallListeners({
        chainId,
        calls,
        options
      })
    )

    return () => {
      dispatch(
        removeMulticallListeners({
          chainId,
          calls,
          options
        })
      )
    }
  }, [chainId, dispatch, options, serializedCallKeys])

  return useMemo(
    () =>
      calls.map<CallResult>(call => {
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
        result
      }
    }
  }
  return {
    valid: true,
    loading: false,
    syncing,
    result: result,
    error: !success
  }
}

export function useSingleContractMultipleData(
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[],
  options?: ListenerOptions
): CallState[] {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])

  const calls = useMemo(
    () =>
      contract && fragment && callInputs && callInputs.length > 0
        ? callInputs.map<Call>(inputs => {
            return {
              address: contract.address,
              callData: contract.interface.encodeFunctionData(fragment, inputs)
            }
          })
        : [],
    [callInputs, contract, fragment]
  )

  const results = useCallsData(calls, options)

  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return results.map(result => toCallState(result, contract?.interface, fragment, latestBlockNumber))
  }, [fragment, contract, results, latestBlockNumber])
}

// export async function usePoolAssetsBalances(
//   pools: Array<{ pool: string, tokenA: Token | undefined, tokenB: Token | undefined }>,
//   options?: ListenerOptions
// ): Promise<Array<{ pool: string | undefined, amountA: TokenAmount | undefined, amountB: TokenAmount | undefined }>> {
//
//   const { chainId, library } = useActiveWeb3React()
//
//   if (!library) {
//     return Promise.resolve([{ pool: undefined, amountA: undefined, amountB: undefined }])
//   }
//
//   const x = pools.map(async ({ pool, tokenA, tokenB }) => {
//
//     if (!tokenA || !tokenB || !chainId || pool === '0x0000000000000000000000000000000000000000') {
//       return { pool, amountA: undefined, amountB: undefined }
//     }
//
//     try {
//       let balance0;
//       let balance1;
//       if (!tokenA.isEther) {
//         const contract0 = getContract(tokenA.address, ERC20ABI, library);
//         balance0 = await contract0.balanceOf(pool)
//       } else {
//         const contract0 = getContract(MULTICALL_NETWORKS[chainId], MULTICALL_ABI, library);
//         balance0 = await contract0.getEthBalance(pool)
//       }
//       if (!tokenB.isEther) {
//         const contract1 = getContract(tokenB.address, ERC20ABI, library);
//         balance1 = await contract1.balanceOf(pool)
//       } else {
//         const contract1 = getContract(MULTICALL_NETWORKS[chainId], MULTICALL_ABI, library);
//         balance1 = await contract1.getEthBalance(pool)
//       }
//
//       const amountA = new TokenAmount(tokenA, balance0)
//       const amountB = new TokenAmount(tokenB, balance1)
//       return { pool, amountA, amountB }
//     } catch (e) {
//       return { pool, amountA: undefined, amountB: undefined }
//     }
//   })
//
//   return Promise.all(x)
//
//   // ERC20_INTERFACE.getFunction(`balanceOf`, [])
//   // const
//   // contractInterface.getFunction(methodName), [contractInterface, methodName])
//   // return [];
//   // const fragment = useMemo(() => contractInterface.getFunction(methodName), [contractInterface, methodName])
//   // const callData: string | undefined = useMemo(
//   //   () =>
//   //     fragment && isValidMethodArgs(callInputs)
//   //       ? contractInterface.encodeFunctionData(fragment, callInputs)
//   //       : undefined,
//   //   [callInputs, contractInterface, fragment]
//   // )
//   //
//   // const calls = useMemo(
//   //   () =>
//   //     fragment && addresses && addresses.length > 0 && callData
//   //       ? addresses.map<Call | undefined>(address => {
//   //         return address && callData
//   //           ? {
//   //             address,
//   //             callData
//   //           }
//   //           : undefined
//   //       })
//   //       : [],
//   //   [addresses, callData, fragment]
//   // )
//   //
//   // const results = useCallsData(calls, options)
//   //
//   // const latestBlockNumber = useBlockNumber()
//   //
//   // return useMemo(() => {
//   //   return results.map(result => toCallState(result, contractInterface, fragment, latestBlockNumber))
//   // }, [fragment, results, contractInterface, latestBlockNumber])
// }

export function useMultipleContractSingleData(
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs,
  options?: ListenerOptions
): CallState[] {
  const fragment = useMemo(() => contractInterface.getFunction(methodName), [contractInterface, methodName])
  const callData: string | undefined = useMemo(
    () =>
      fragment && isValidMethodArgs(callInputs)
        ? contractInterface.encodeFunctionData(fragment, callInputs)
        : undefined,
    [callInputs, contractInterface, fragment]
  )

  const calls = useMemo(
    () =>
      fragment && addresses && addresses.length > 0 && callData
        ? addresses.map<Call | undefined>(address => {
          return address && callData
            ? {
              address,
              callData
            }
            : undefined
        })
        : [],
    [addresses, callData, fragment]
  )

  const results = useCallsData(calls, options)

  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return results.map(result => toCallState(result, contractInterface, fragment, latestBlockNumber))
  }, [fragment, results, contractInterface, latestBlockNumber])
}

export function useSingleCallResult(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options?: ListenerOptions
): CallState {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])

  const calls = useMemo<Call[]>(() => {
    return contract && fragment && isValidMethodArgs(inputs)
      ? [
          {
            address: contract.address,
            callData: contract.interface.encodeFunctionData(fragment, inputs)
          }
        ]
      : []
  }, [contract, fragment, inputs])

  const result = useCallsData(calls, options)[0]
  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return toCallState(result, contract?.interface, fragment, latestBlockNumber)
  }, [result, contract, fragment, latestBlockNumber])
}
