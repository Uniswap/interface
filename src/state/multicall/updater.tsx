import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { useMulticallContract } from '../../hooks/useContract'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { splitCallKey, updateMulticallResults } from './actions'

export default function Updater() {
  const dispatch = useDispatch<AppDispatch>()
  const state = useSelector<AppState, AppState['multicall']>(state => state.multicall)
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const contract = useMulticallContract()

  const listeningKeys = useMemo(() => {
    if (!chainId || !state.callListeners[chainId]) return []
    return Object.keys(state.callListeners[chainId]).filter(callKey => state.callListeners[chainId][callKey] > 0)
  }, [state.callListeners, chainId])

  const outdatedCallKeys = useMemo(() => {
    if (!chainId || !state.callResults[chainId]) return listeningKeys
    if (!latestBlockNumber) return []

    return listeningKeys.filter(key => {
      const data = state.callResults[chainId][key]
      return !data || data.blockNumber < latestBlockNumber
    })
  }, [chainId, state.callResults, listeningKeys, latestBlockNumber])

  useEffect(() => {
    if (!contract || !chainId || outdatedCallKeys.length === 0) return
    const calls = outdatedCallKeys.map(key => splitCallKey(key))

    contract.aggregate.call(calls).then((results: any) => {
      console.log(results)
      debugger
      dispatch(
        updateMulticallResults({
          chainId,
          results: outdatedCallKeys.reduce<{ [callKey: string]: string | null }>((memo, callKey, i) => {
            memo[callKey] = results[i]
            return memo
          }, {}),
          blockNumber: results[0]
        })
      )
    })
  }, [chainId, contract, dispatch, outdatedCallKeys])

  return null
}
