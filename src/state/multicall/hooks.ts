import { Interface } from '@ethersproject/abi'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { addMulticallListeners, Call, removeMulticallListeners, toCallKey } from './actions'

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

export function useContractsData(
  contractInterface?: Interface,
  addresses?: (string | undefined)[],
  methodName?: string,
  methodArgs?: Array<any>
): {
  [address: string]: Result | undefined
} {
  const { chainId } = useActiveWeb3React()
  const results = useSelector<AppState, AppState['multicall']['callResults']>(state => state.multicall.callResults)
  const dispatch = useDispatch<AppDispatch>()

  const unserializedCalls = useMemo<Call[]>(() => {
    if (!contractInterface || !methodName) return []
    const validAddresses: string[] = addresses?.map(isAddress)?.filter((a): a is string => a !== false) ?? []

    const callData = contractInterface.encodeFunctionData(methodName, methodArgs)
    return callData ? validAddresses.map(address => ({ address, callData })) : []
  }, [addresses, methodArgs, contractInterface, methodName])

  const serializedCalls = useMemo(() => JSON.stringify(unserializedCalls.sort()), [unserializedCalls])

  useEffect(() => {
    const calls: Call[] = JSON.parse(serializedCalls)
    if (!chainId || calls.length === 0) return
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
  }, [contractInterface, addresses, methodName, chainId, dispatch, serializedCalls])

  return useMemo(() => {
    const calls: Call[] = JSON.parse(serializedCalls)
    if (!chainId || calls.length === 0 || !contractInterface || !methodName) return {}

    return calls.reduce<{ [address: string]: Result }>((memo, call) => {
      const data = results[chainId]?.[toCallKey(call)]?.data
      if (data?.match(/^0x[a-fA-F0-9]+/)) {
        memo[call.address] = contractInterface.decodeFunctionResult(methodName, data)
      }
      return memo
    }, {})
  }, [chainId, contractInterface, methodName, results, serializedCalls])
}

export function useContractData(
  contractInterface?: Interface,
  address?: string,
  methodName?: string,
  methodArgs?: Array<any>
): Result | undefined {
  const data = useContractsData(contractInterface, [address], methodName, methodArgs)
  const validated = isAddress(address)
  if (!validated) return undefined
  return data[validated]
}
