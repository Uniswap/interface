import { BigNumber } from '@ethersproject/bignumber'
import { Contract } from '@ethersproject/contracts'
import { useWeb3React } from '@web3-react/core'
import { FunctionFragment, Interface } from 'ethers/lib/utils'
import useBlockNumber from 'lib/hooks/useBlockNumber'
import { ChainTokenMap, tokensToChainTokenMap } from 'lib/hooks/useTokenList/utils'
import { useEffect, useMemo } from 'react'
import {
  addV3MulticallListeners,
  parseCallKey,
  removeV3MulticallListeners,
  toCallKey,
  V3ListenerOptions,
} from 'state/farm/actions'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { Call } from 'utils/farmUtils'
import sortByListPriority from 'utils/listSort'

import BROKEN_LIST from '../../constants/tokenLists/broken.tokenlist.json'
import { AppState } from '../types'
import { DEFAULT_ACTIVE_LIST_URLS, UNSUPPORTED_LIST_URLS } from './../../constants/lists'

export type TokenAddressMap = ChainTokenMap
interface Result extends ReadonlyArray<any> {
  readonly [key: string]: any
}

type MethodArg = string | number | BigNumber
type MethodArgs = Array<MethodArg | MethodArg[]>

type OptionalMethodInputs = Array<MethodArg | MethodArg[] | undefined> | undefined

type Mutable<T> = {
  -readonly [P in keyof T]: Mutable<T[P]>
}

export function useAllLists(): AppState['lists']['byUrl'] {
  return useAppSelector((state) => state.lists.byUrl)
}

function isMethodArg(x: unknown): x is MethodArg {
  return BigNumber.isBigNumber(x) || ['string', 'number'].indexOf(typeof x) !== -1
}

function isValidMethodArgs(x: unknown): x is MethodArgs | undefined {
  return (
    x === undefined ||
    (Array.isArray(x) && x.every((xi) => isMethodArg(xi) || (Array.isArray(xi) && xi.every(isMethodArg))))
  )
}

/**
 * Combine the tokens in map2 with the tokens on map1, where tokens on map1 take precedence
 * @param map1 the base token map
 * @param map2 the map of additioanl tokens to add to the base map
 */
function combineMaps(map1: TokenAddressMap, map2: TokenAddressMap): TokenAddressMap {
  const chainIds = Object.keys(
    Object.keys(map1)
      .concat(Object.keys(map2))
      .reduce<{ [chainId: string]: true }>((memo, value) => {
        memo[value] = true
        return memo
      }, {})
  ).map((id) => parseInt(id))

  return chainIds.reduce<Mutable<TokenAddressMap>>((memo, chainId) => {
    memo[chainId] = {
      ...map2[chainId],
      // map1 takes precedence
      ...map1[chainId],
    }
    return memo
  }, {}) as TokenAddressMap
}

// merge tokens contained within lists from urls
export function useCombinedTokenMapFromUrls(urls: string[] | undefined): TokenAddressMap {
  const lists = useAllLists()
  return useMemo(() => {
    if (!urls) return {}
    return (
      urls
        .slice()
        // sort by priority so top priority goes last
        .sort(sortByListPriority)
        .reduce((allTokens, currentUrl) => {
          const current = lists[currentUrl]?.current
          if (!current) return allTokens
          try {
            return combineMaps(allTokens, tokensToChainTokenMap(current))
          } catch (error) {
            console.error('Could not show token list due to error', error)
            return allTokens
          }
        }, {})
    )
  }, [lists, urls])
}

// get all the tokens from active lists, combine with local default tokens
export function useCombinedActiveList(): TokenAddressMap {
  const activeTokens = useCombinedTokenMapFromUrls(DEFAULT_ACTIVE_LIST_URLS)
  return activeTokens
}

// list of tokens not supported on interface for various reasons, used to show warnings and prevent swaps and adds
export function useUnsupportedTokenList(): TokenAddressMap {
  // get hard-coded broken tokens
  const brokenListMap = useMemo(() => tokensToChainTokenMap(BROKEN_LIST), [])

  // get dynamic list of unsupported tokens
  const loadedUnsupportedListMap = useCombinedTokenMapFromUrls(UNSUPPORTED_LIST_URLS)

  // format into one token address map
  return useMemo(() => combineMaps(brokenListMap, loadedUnsupportedListMap), [brokenListMap, loadedUnsupportedListMap])
}

interface CallResult {
  readonly valid: boolean
  readonly data?: string
  readonly blockNumber?: number
}
const INVALID_RESULT: CallResult = {
  valid: false,
  blockNumber: undefined,
  data: undefined,
}

const INVALID_CALL_STATE: CallState = {
  valid: false,
  result: undefined,
  loading: false,
  syncing: false,
  error: false,
}

const LOADING_CALL_STATE: CallState = {
  valid: true,
  result: undefined,
  loading: true,
  syncing: true,
  error: false,
}

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
        result,
        loading: false,
        syncing,
        error: true,
      }
    }
  }

  return {
    valid: true,
    result,
    loading: false,
    syncing,
    error: !success,
  }
}

function useCallsData(
  calls: (Call | undefined)[],
  { blocksPerFetch }: V3ListenerOptions = { blocksPerFetch: 1 },
  methodName?: string
): CallResult[] {
  const { chainId } = useWeb3React()
  const callResults = useAppSelector((state) => state.multicallV3.callResults)
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
      addV3MulticallListeners({
        chainId,
        calls,
        options: { blocksPerFetch },
      })
    )

    return () => {
      dispatch(
        removeV3MulticallListeners({
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
        } else {
          // console.error(result, result?.data, call)
        }

        return { valid: true, data, blockNumber: result?.blockNumber }
      }),
    [callResults, calls, chainId]
  )
}

interface CallState {
  readonly valid: boolean
  // the result, or undefined if loading or errored/no data
  readonly result?: Result
  // true if the result has never been fetched
  readonly loading: boolean
  // true if the result is not for the latest block
  readonly syncing: boolean
  // true if the call was made and is synced, but the return data is invalid
  readonly error: boolean
}

function useSingleCallResult(
  contract: Contract | null | undefined,
  methodName: string,
  inputs?: OptionalMethodInputs,
  options?: Partial<V3ListenerOptions> & { gasRequired?: number }
): CallState {
  const fragment = useMemo(() => contract?.interface?.getFunction(methodName), [contract, methodName])

  const blocksPerFetch = options?.blocksPerFetch
  const gasRequired = options?.gasRequired

  const calls = useMemo<Call[]>(() => {
    return contract && fragment && isValidMethodArgs(inputs)
      ? [
          {
            address: contract.address,
            callData: contract.interface.encodeFunctionData(fragment, inputs),
            ...(gasRequired ? { gasRequired } : {}),
          },
        ]
      : []
  }, [contract, fragment, inputs, gasRequired])

  const result = useCallsData(calls, blocksPerFetch ? { blocksPerFetch } : undefined)[0]
  const latestBlockNumber = useBlockNumber()

  return useMemo(() => {
    return toCallState(result, contract?.interface, fragment, latestBlockNumber)
  }, [result, contract, fragment, latestBlockNumber])
}

// export function useMultipleContractMultipleData(
//   contracts: (Contract | null | undefined)[],
//   methodName: string,
//   callInputsArr: OptionalMethodInputs[][],
//   options: Partial<V3ListenerOptions> & { gasRequired?: number } = {}
// ): CallState[][] {
//   const blocksPerFetch = options?.blocksPerFetch
//   const gasRequired = options?.gasRequired

//   const calls = useMemo(() => {
//     let i = 0
//     return contracts.reduce<
//       {
//         call?: Call
//         contract?: Contract | null
//         fragment?: FunctionFragment
//         callIndex: number
//         contractIndex: number
//       }[]
//     >((memo, contract, index) => {
//       const callInputs = callInputsArr[index]
//       if (callInputs.length > 0) {
//         for (const inputs of callInputs) {
//           const fragment = contract ? contract.interface.getFunction(methodName) : undefined
//           const call =
//             contract && fragment && isValidMethodArgs(inputs)
//               ? {
//                   address: contract.address,
//                   callData: contract.interface.encodeFunctionData(fragment, inputs),
//                   ...(gasRequired ? { gasRequired } : {}),
//                 }
//               : undefined
//           memo.push({
//             call,
//             contract,
//             fragment,
//             callIndex: i,
//             contractIndex: index,
//           })
//           i++
//         }
//       }
//       return memo
//     }, [])
//   }, [callInputsArr, contracts, gasRequired, methodName])

//   const results = useCallsData(
//     calls.map((call) => call.call),
//     blocksPerFetch ? { blocksPerFetch } : undefined,
//     methodName
//   )

//   const latestBlockNumber = useBlockNumber()

//   return useMemo(() => {
//     return contracts.map((_, ind) => {
//       const filteredCalls = calls.filter((call) => call.contractIndex === ind)
//       return filteredCalls.map((call) =>
//         toCallState(results[call.callIndex], call.contract?.interface, call.fragment, latestBlockNumber)
//       )
//     })
//   }, [contracts, calls, results, latestBlockNumber])
// }
