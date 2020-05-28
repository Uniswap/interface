import { Interface, FunctionFragment } from '@ethersproject/abi'
import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import { isAddress } from '../../utils'
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

function isMethodArgs(x: unknown): x is MethodArgs {
  return x && Array.isArray(x) && x.every(y => isMethodArg(y) || (Array.isArray(y) && y.every(isMethodArg)))
}

// the lowest level call for subscribing to contract data
function useCallsData(
  specs?: (
    | {
        address?: string
        fragment?: FunctionFragment
        inputs?: OptionalMethodInputs
      }
    | undefined
  )[]
): (Result | undefined)[] {
  const { chainId } = useActiveWeb3React()
  const callResults = useSelector<AppState, AppState['multicall']['callResults']>(state => state.multicall.callResults)
  const dispatch = useDispatch<AppDispatch>()

  const contractInterfaces: (Interface | undefined)[] = useMemo(() => {
    return specs?.map(s => (s && s.fragment ? new Interface([s.fragment]) : undefined)) ?? []
  }, [specs])

  // used for subscribing to the contract data
  const calls = useMemo<(Call | false)[]>(() => {
    if (!specs || specs.length === 0) return []

    return specs.map((spec, i): Call | false => {
      const validated = isAddress(spec?.address)
      const contractInterface = contractInterfaces[i]

      if (
        !spec ||
        !validated ||
        !contractInterface ||
        !spec.fragment ||
        (typeof spec.inputs !== 'undefined' && !isMethodArgs(spec.inputs))
      ) {
        return false
      }

      return {
        address: validated,
        callData: contractInterface.encodeFunctionData(spec.fragment, spec.inputs)
      }
    })
  }, [contractInterfaces, specs])

  const serializedCallKeys: string = useMemo(
    () =>
      JSON.stringify(
        calls
          .filter((c): c is Call => c !== false)
          .map(toCallKey)
          .sort()
      ),
    [calls]
  )

  const debouncedSerializedCallKeys = useDebounce(serializedCallKeys, 100)

  // update listeners when there is an actual change
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
    return calls.map<Result | undefined>((c, i) => {
      if (!chainId || !c || !contractInterfaces[i]) return undefined

      const contractInterface = contractInterfaces[i]
      const fragment = specs?.[i]?.fragment
      if (!contractInterface || !fragment) return undefined

      const result = callResults[chainId]?.[toCallKey(c)]
      if (!result || !result.data || result.data === '0x') {
        return undefined
      }

      return contractInterface.decodeFunctionResult(fragment, result.data)
    })
  }, [callResults, calls, chainId, contractInterfaces, specs])
}

function getFragment(contractInterface?: Interface | null, methodName?: string): FunctionFragment | undefined {
  return methodName ? contractInterface?.getFunction(methodName) : undefined
}

export function useMultipleCallSingleContractResult(
  contract: Contract | null | undefined,
  methodName: string,
  callInputs: OptionalMethodInputs[]
): (Result | undefined)[] {
  const fragment = getFragment(contract?.interface, methodName)

  const calls = useMemo(
    () =>
      contract && callInputs && fragment
        ? callInputs.map(inputs => {
            return {
              fragment,
              address: contract.address,
              inputs
            }
          })
        : [],
    [callInputs, contract, fragment]
  )

  return useCallsData(calls)
}

export function useMultipleContractSingleData(
  addresses: (string | undefined)[],
  contractInterface: Interface,
  methodName: string,
  callInputs?: OptionalMethodInputs
): (Result | undefined)[] {
  const fragment = useMemo(() => getFragment(contractInterface, methodName), [contractInterface, methodName])

  const calls = useMemo(
    () =>
      fragment && callInputs
        ? addresses.map(address => {
            return {
              fragment,
              address: address,
              inputs: callInputs
            }
          })
        : [],
    [addresses, callInputs, fragment]
  )

  return useCallsData(calls)
}

export function useSingleCallResult(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs
): Result | undefined {
  const calls = useMemo(() => {
    return contract
      ? [
          {
            fragment: getFragment(contract.interface, methodName),
            address: contract.address,
            inputs: inputs
          }
        ]
      : []
  }, [contract, inputs, methodName])

  return useCallsData(calls)[0]
}
