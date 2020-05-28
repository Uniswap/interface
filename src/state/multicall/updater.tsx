import { BigNumber } from '@ethersproject/bignumber'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useMulticallContract } from '../../hooks/useContract'
import useDebounce from '../../hooks/useDebounce'
import chunkArray from '../../utils/chunkArray'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { parseCallKey, updateMulticallResults } from './actions'

// limit to 100 calls at a time max, so that we do not exceed the block gas limit
const CALL_CHUNK_SIZE = 100

export default function Updater() {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['multicall']>(state => state.multicall)
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const multicallContract = useMulticallContract()

  const listeningKeys = useMemo(() => {
    if (!chainId || !state.callListeners[chainId]) return []
    return Object.keys(state.callListeners[chainId]).filter(callKey => state.callListeners[chainId][callKey] > 0)
  }, [state.callListeners, chainId])

  const debouncedListeningKeys = useDebounce(listeningKeys, 100)

  const unserializedOutdatedCallKeys = useMemo(() => {
    if (!chainId || !state.callResults[chainId]) return debouncedListeningKeys
    if (!latestBlockNumber) return []

    return debouncedListeningKeys.filter(key => {
      const data = state.callResults[chainId][key]
      return !data || data.blockNumber < latestBlockNumber
    })
  }, [chainId, state.callResults, debouncedListeningKeys, latestBlockNumber])

  const serializedOutdatedCallKeys = useMemo(() => JSON.stringify(unserializedOutdatedCallKeys.sort()), [
    unserializedOutdatedCallKeys
  ])

  useEffect(() => {
    const outdatedCallKeys: string[] = JSON.parse(serializedOutdatedCallKeys)
    if (!multicallContract || !chainId || outdatedCallKeys.length === 0) return
    const calls = outdatedCallKeys.map(key => parseCallKey(key))

    const chunkedCalls = chunkArray(calls, CALL_CHUNK_SIZE)

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
        })
    )
  }, [chainId, multicallContract, dispatch, serializedOutdatedCallKeys])

  return null
}
