import { Interface } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import { AppDispatch, AppState } from '../index'
import { addMulticallListeners, Call, removeMulticallListeners, parseCallKey, toCallKey } from './actions'

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

// the lowest level call for subscribing to contract data
function useCallsData(calls: (Call | undefined)[]): (string | undefined)[] {
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

  const debouncedSerializedCallKeys = useDebounce(serializedCallKeys, 20)

  // update listeners when there is an actual change that persists for at least 100ms
  useEffect(() => {
    const callKeys: string[] = JSON.parse(debouncedSerializedCallKeys)
    if (!chainId || callKeys.length === 0) return
    const calls = callKeys.map(key => parseCallKey(key))
    dispatch(
      addMulticallListeners({
        chainId,
        calls
      })
    )

    return () => {
      dispatch(
        removeMulticallListeners({
          chainId,
          calls
        })
      )
    }
  }, [chainId, dispatch, debouncedSerializedCallKeys])

  return useMemo(() => {
    return calls.map<string | undefined>(call => {
      if (!chainId || !call) return undefined

      const result = callResults[chainId]?.[toCallKey(call)]
      if (!result || !result.data || result.data === '0x') {
        return undefined
      }

      return result.data
    })
  }, [callResults, calls, chainId])
}

export function useSingleContractMultipleData(
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[]
): (Result | undefined)[] {
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

  const data = useCallsData(calls)

  return useMemo(() => {
    if (!fragment || !contract) return []
    return data.map(data => (data ? contract.interface.decodeFunctionResult(fragment, data) : undefined))
  }, [contract, data, fragment])
}

export function useMultipleContractSingleData(
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs
): (Result | undefined)[] {
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

  const data = useCallsData(calls)

  return useMemo(() => {
    if (!fragment) return []
    return data.map(data => (data ? contractInterface.decodeFunctionResult(fragment, data) : undefined))
  }, [contractInterface, data, fragment])
}

export function useSingleCallResult(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs
): Result | undefined {
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

  const data = useCallsData(calls)[0]
  return useMemo(() => {
    if (!contract || !fragment || !data) return undefined
    return contract.interface.decodeFunctionResult(fragment, data)
  }, [data, fragment, contract])
}
