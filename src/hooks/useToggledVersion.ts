import useParsedQueryString from './useParsedQueryString'

export enum Version {
  v2 = 'v2',
  v3 = 'v3',
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
