import { BigNumber } from '@ethersproject/bignumber'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useMulticallContract } from '../../hooks/useContract'
import useDebounce from '../../hooks/useDebounce'
import chunkArray from '../../utils/chunkArray'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import {
  errorFetchingMulticallResults,
  fetchingMulticallResults,
  parseCallKey,
  updateMulticallResults
} from './actions'

// chunk calls so we do not exceed the gas limit
const CALL_CHUNK_SIZE = 250

/**
 * From the current all listeners state, return each call key mapped to the
 * minimum number of blocks per fetch. This is how often each key must be fetched.
 * @param allListeners the all listeners state
 * @param chainId the current chain id
 */
function activeListeningKeys(
  allListeners: AppState['multicall']['callListeners'],
  chainId?: number
): { [callKey: string]: number } {
  if (!allListeners || !chainId) return {}
  const listeners = allListeners[chainId]
  if (!listeners) return {}

  return Object.keys(listeners).reduce<{ [callKey: string]: number }>((memo, callKey) => {
    const keyListeners = listeners[callKey]

    memo[callKey] = Object.keys(keyListeners)
      .filter(key => keyListeners[parseInt(key)] > 0)
      .reduce((previousMin, current) => {
        return Math.min(previousMin, parseInt(current))
      }, Infinity)
    return memo
  }, {})
}

export default function Updater() {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['multicall']>(state => state.multicall)
  // wait for listeners to settle before triggering updates
  const debouncedListeners = useDebounce(state.callListeners, 100)
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract()

  const listeningKeys: { [callKey: string]: number } = useMemo(() => {
    return activeListeningKeys(debouncedListeners, chainId)
  }, [debouncedListeners, chainId])

  const unserializedOutdatedCallKeys = useMemo(() => {
    // wait for these before fetching any data
    if (!chainId || !latestBlockNumber) return []
    // no results at all, load everything
    if (!state.callResults[chainId]) return Object.keys(listeningKeys)

    return Object.keys(listeningKeys).filter(callKey => {
      const blocksPerFetch = listeningKeys[callKey]

      const data = state.callResults[chainId][callKey]
      // no data, must fetch
      if (!data) return true

      // already fetching it
      if (data.fetchingBlockNumber && data.fetchingBlockNumber >= latestBlockNumber + blocksPerFetch) return false

      // data block number is older than blocksPerFetch blocks
      return data.blockNumber <= latestBlockNumber - blocksPerFetch
    })
  }, [chainId, state.callResults, listeningKeys, latestBlockNumber])

  const serializedOutdatedCallKeys = useMemo(() => JSON.stringify(unserializedOutdatedCallKeys.sort()), [
    unserializedOutdatedCallKeys
  ])

  useEffect(() => {
    if (!latestBlockNumber || !chainId || !multicallContract) return

    const outdatedCallKeys: string[] = JSON.parse(serializedOutdatedCallKeys)
    if (outdatedCallKeys.length === 0) return
    const calls = outdatedCallKeys.map(key => parseCallKey(key))

    const chunkedCalls = chunkArray(calls, CALL_CHUNK_SIZE)

    dispatch(
      fetchingMulticallResults({
        calls,
        chainId,
        fetchingBlockNumber: latestBlockNumber
      })
    )

    chunkedCalls.forEach((chunk, index) =>
      multicallContract
        .aggregate(chunk.map(obj => [obj.address, obj.callData]))
        .then(([resultsBlockNumber, returnData]: [BigNumber, string[]]) => {
          // accumulates the length of all previous indices
          const firstCallKeyIndex = chunkedCalls.slice(0, index).reduce<number>((memo, curr) => memo + curr.length, 0)
          const lastCallKeyIndex = firstCallKeyIndex + returnData.length

          dispatch(
            updateMulticallResults({
              chainId,
              results: outdatedCallKeys
                .slice(firstCallKeyIndex, lastCallKeyIndex)
                .reduce<{ [callKey: string]: string | null }>((memo, callKey, i) => {
                  memo[callKey] = returnData[i] ?? null
                  return memo
                }, {}),
              blockNumber: resultsBlockNumber.toNumber()
            })
          )
        })
        .catch((error: any) => {
          console.error('Failed to fetch multicall chunk', chunk, chainId, error)
          dispatch(
            errorFetchingMulticallResults({
              calls: chunk,
              chainId,
              fetchingBlockNumber: latestBlockNumber
            })
          )
        })
    )
  }, [chainId, multicallContract, dispatch, serializedOutdatedCallKeys, latestBlockNumber])

  return null
}
