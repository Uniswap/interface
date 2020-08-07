// import useParsedQueryString from './useParsedQueryString'

export enum Version {
  v1 = 'v1',
  v2 = 'v2',
  v3 = 'v3',
}

export const DEFAULT_VERSION: Version = Version.v3

export default function useToggledVersion(): Version {
  // const { use } = useParsedQueryString()
  // if (!use || typeof use !== 'string') return Version.v2
  // if (use.toLowerCase() === 'v1') return Version.v1
  return DEFAULT_VERSION
}
