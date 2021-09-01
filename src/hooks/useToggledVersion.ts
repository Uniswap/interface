import { stringify } from 'querystring'
import { useMemo, useCallback } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import useParsedQueryString from './useParsedQueryString'

export enum Version {
  v2 = 'V2',
  v3 = 'V3',
}

export const DEFAULT_VERSION: Version = Version.v3

export default function useToggledVersion(): Version {
  const { use } = useParsedQueryString()
  if (typeof use !== 'string') {
    return DEFAULT_VERSION
  }
  switch (use.toLowerCase()) {
    case 'v2':
      return Version.v2
    case 'v3':
      return Version.v3
    default:
      return Version.v3
  }
}

/** Returns a callback to toggle to `target` version. */
export function useToggleVersionCallback(target: Version) {
  const location = useLocation()
  const search = useParsedQueryString()
  const history = useHistory()

  const linkDestination = useMemo(() => {
    return {
      ...location,
      search: `${stringify({
        ...search,
        use: target !== DEFAULT_VERSION ? target : undefined,
      })}`,
    }
  }, [location, search, target])

  return useCallback(() => {
    history.replace(linkDestination)
  }, [history, linkDestination])
}
