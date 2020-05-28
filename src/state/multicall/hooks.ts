import { Interface } from '@ethersproject/abi'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { addMulticallListeners, Call, removeMulticallListeners, parseCallKey, toCallKey } from './actions'

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

export function useContractsData(
  contractInterface?: Interface,
  addresses?: (string | undefined)[],
  methodName?: string,
  methodArgs?: Array<string | number>
): {
  [address: string]: Result | undefined
} {
  const { chainId } = useActiveWeb3React()
  const callResults = useSelector<AppState, AppState['multicall']['callResults']>(state => state.multicall.callResults)
  const dispatch = useDispatch<AppDispatch>()

  const unserializedCallKeys = useMemo<string[]>(() => {
    if (!contractInterface || !methodName) return []
    // skip if any args are undefined
    if (methodArgs && methodArgs.some(arg => ['string', 'number'].indexOf(typeof arg) === -1)) return []

    const validAddresses: string[] = addresses?.map(isAddress)?.filter((a): a is string => a !== false) ?? []

    const callData = contractInterface.encodeFunctionData(methodName, methodArgs)
    return callData ? validAddresses.map(address => toCallKey({ address, callData })) : []
  }, [addresses, contractInterface, methodArgs, methodName])

  const serializedCallKeys: string = useMemo(() => JSON.stringify(unserializedCallKeys.sort()), [unserializedCallKeys])

  useEffect(() => {
    const calls: string[] = JSON.parse(serializedCallKeys)
    const parsedCalls: Call[] = calls.map(c => parseCallKey(c))
    if (!chainId || calls.length === 0) return
    dispatch(
      addMulticallListeners({
        chainId,
        calls: parsedCalls
      })
    )

    return () => {
      dispatch(
        removeMulticallListeners({
          chainId,
          calls: parsedCalls
        })
      )
    }
  }, [chainId, dispatch, serializedCallKeys])

  return useMemo(() => {
    const callKeys: string[] = JSON.parse(serializedCallKeys)
    if (!chainId || callKeys.length === 0 || !contractInterface || !methodName) return {}

    return callKeys.reduce<{ [address: string]: Result }>((memo, callKey) => {
      const data = callResults[chainId]?.[callKey]?.data
      if (data && data !== '0x') {
        const parsed = parseCallKey(callKey)
        memo[parsed.address] = contractInterface.decodeFunctionResult(methodName, data)
      }
      return memo
    }, {})
  }, [callResults, chainId, contractInterface, methodName, serializedCallKeys])
}

export function useContractData(
  contractInterface?: Interface,
  address?: string,
  methodName?: string,
  methodArgs?: Array<string | number>
): Result | undefined {
  const data = useContractsData(contractInterface, [address], methodName, methodArgs)
  const validated = isAddress(address)
  if (!validated) return undefined
  return data[validated]
}
