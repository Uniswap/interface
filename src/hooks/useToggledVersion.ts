export enum Version {
  v2 = 'V2',
  v3 = 'V3',
}

export const DEFAULT_VERSION: Version = Version.v2

export default function useToggledVersion(): Version {
  return Version.v2
}
