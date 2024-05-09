import { isExtension } from 'uniswap/src/utils/platform'

export const getVersionHeader = (): string => {
  if (isExtension) {
    return process.env.VERSION ?? ''
  } else {
    // unimplemented for interface
    return ''
  }
}
