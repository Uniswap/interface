import useParsedQueryString from './useParsedQueryString'

export enum Version {
  v2 = 'v2'
}

export const DEFAULT_VERSION: Version = Version.v2

export default function useToggledVersion(): Version {
  const { use } = useParsedQueryString()
  if (!use || typeof use !== 'string') return Version.v2
  return DEFAULT_VERSION
}
