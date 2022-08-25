import { useCallback, useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useActiveWeb3React } from 'hooks'
import { AppState } from 'state'
import { useAppDispatch } from 'state/hooks'

import { updateExcludeDex } from '.'

export const useAllDexes = () => {
  const { chainId } = useActiveWeb3React()
  const dexes = useSelector<AppState, AppState['customizeDexes']['allDexes']>(state => state.customizeDexes.allDexes)

  return useMemo(() => {
    if (!chainId) return []
    return dexes[chainId]
  }, [chainId, dexes])
}

export const useExcludeDexes = (): [string[], (value: string[]) => void] => {
  const { chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()
  const excludeDexes = useSelector<AppState, AppState['customizeDexes']['excludeDexes']>(
    state => state.customizeDexes.excludeDexes,
  )

  const excludeDexesByChainId: string[] = useMemo(() => {
    if (!chainId) return []
    return excludeDexes?.[chainId] || []
  }, [chainId, excludeDexes])

  const setExcludeDexes = useCallback(
    (dexes: string[]) => {
      if (chainId) dispatch(updateExcludeDex({ chainId, dexes }))
    },
    [chainId, dispatch],
  )

  return [excludeDexesByChainId, setExcludeDexes]
}
