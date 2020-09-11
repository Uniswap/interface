export enum Version {
  v1 = 'v1',
  v2 = 'v2'
}

export const DEFAULT_VERSION: Version = Version.v2

export default function useToggledVersion(): Version {
  return DEFAULT_VERSION
}
