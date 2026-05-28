import { getConfig } from '@universe/config'

export const getVersionHeader = (): string => {
  return getConfig().appVersion
}
