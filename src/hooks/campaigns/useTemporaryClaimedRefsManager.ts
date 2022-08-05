/**
 * After claiming rewards, it may take a while for the campaign service to sync data from the subgraph.
 * So we use this hook to disable it when waiting backend to be synced.
 *
 * This hook should be used after claim reward transaction success.
 */
import { useCallback, useMemo } from 'react'
import { useLocalStorage } from 'react-use'

export default function useTemporaryClaimedRefsManager(): [string[], (claimedRefs: string[]) => void] {
  const [claimedRefs, setClaimedRefs] = useLocalStorage<string[]>('campaign-claimed-refs', [])

  const onAddClaimedRefs = useCallback(
    (claimedRefs: string[]) => {
      setClaimedRefs(prev => {
        const newState = [...(prev ?? []), ...claimedRefs]
        return newState
      })
    },
    [setClaimedRefs],
  )

  return useMemo(() => {
    return [claimedRefs ?? [], onAddClaimedRefs]
  }, [claimedRefs, onAddClaimedRefs])
}
