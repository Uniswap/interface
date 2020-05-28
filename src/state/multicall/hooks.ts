import { Interface } from '@ethersproject/abi'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { isAddress } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { addMulticallListeners, removeMulticallListeners, toCallKey } from './actions'

export interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

export function useNoArgCalls(
  contract: Interface,
  addresses: (string | undefined)[],
  methodName: string
): {
  [address: string]: Result | undefined
} {
  const { chainId } = useActiveWeb3React()
  const results = useSelector<AppState, AppState['multicall']['callResults']>(state => state.multicall.callResults)
  const dispatch = useDispatch<AppDispatch>()

  const calls = useMemo(() => {
    const validAddresses: string[] = addresses.map(isAddress).filter((a): a is string => a !== false)

    const callData = contract.encodeFunctionData(methodName)
    return validAddresses.map(address => ({ address, callData }))
  }, [addresses, contract, methodName])

  useEffect(() => {
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
  }, [contract, addresses, methodName, chainId, dispatch, calls])

  if (!chainId || calls.length === 0) return {}

  return calls.reduce<{ [address: string]: Result }>((memo, call) => {
    const data = results[chainId]?.[toCallKey(call)]?.data
    if (data) {
      memo[call.address] = contract.decodeFunctionResult(methodName, data)
    }
    return memo
  }, {})
}
