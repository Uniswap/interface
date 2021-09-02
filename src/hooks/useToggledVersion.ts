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

export function useToggleVersionCallback() {
  const location = useLocation()
  const search = useParsedQueryString()
  const history = useHistory()
  const version = useToggledVersion()

  const linkDestination = useMemo(() => {
    // pluck `use` out of object
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { use, ...rest } = search
    const newUse = version === DEFAULT_VERSION ? { use: Version.v2 } : {}
    return {
      ...location,
      search: `?${stringify({
        ...rest,
        ...newUse,
      })}`,
    }
  }, [location, search, version])

  return useCallback(() => {
    history.replace(linkDestination)
  }, [history, linkDestination])
}
