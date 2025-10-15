import { isExtension } from 'utilities/src/platform'

export const getVersionHeader = (): string => {
  if (isExtension) {
    return process.env.VERSION ?? ''
  } else {
    // unimplemented for interface
    return ''
  }
}
