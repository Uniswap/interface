import useParsedQueryString from './useParsedQueryString'

export enum Version {
  v2 = 'v2',
  v3 = 'v3',
}

export const DEFAULT_VERSION: Version = Version.v2

export default function useToggledVersion(): Version {
  const { use } = useParsedQueryString()
  if (typeof use !== 'string') {
    return DEFAULT_VERSION
  }
  return DEFAULT_VERSION
}
