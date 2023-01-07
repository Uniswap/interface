import useParsedQueryString from './useParsedQueryString'

export enum Version {
  v2 = 'V2',
  v3 = 'V3',
}

export default function useToggledVersion(): Version | undefined {
  const { use } = useParsedQueryString()
  if (typeof use !== 'string') {
    return undefined
  }
  switch (use.toLowerCase()) {
    case 'v2':
      return Version.v2
    case 'v3':
      return Version.v3
    default:
      return undefined
  }
}
