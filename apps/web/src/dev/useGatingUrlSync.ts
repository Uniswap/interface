import { clearGatingUrlParams, overrideGateWithUrlSync } from '@universe/gating'
import { useLocation, useNavigate } from 'react-router'
import { useEvent } from 'utilities/src/react/hooks'

/** The @universe/gating URL-sync writes, bound to a router replace-navigation so later router search writes start from them. */
export function useGatingUrlSync(): {
  overrideGate: (name: string, value: boolean) => void
  clearGatingUrlParams: () => void
} {
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()

  const writeSearch = useEvent((search: string): void => {
    navigate({ pathname, search, hash }, { replace: true })
  })
  const overrideGate = useEvent((name: string, value: boolean): void => {
    overrideGateWithUrlSync({ name, value, writeSearch })
  })
  const clearUrlParams = useEvent((): void => {
    clearGatingUrlParams(writeSearch)
  })

  return { overrideGate, clearGatingUrlParams: clearUrlParams }
}
