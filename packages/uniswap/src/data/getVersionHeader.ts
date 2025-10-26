import { isExtensionApp } from 'utilities/src/platform'

export const getVersionHeader = (): string => {
  if (isExtensionApp) {
    return process.env.VERSION ?? ''
  } else {
    // unimplemented for interface
    return ''
  }
}
