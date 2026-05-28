import { logger } from 'utilities/src/logger/logger'

/**
 * Wraps a namehash so it returns `undefined` instead of throwing
 * on invalid ENS names. safeNamehash was created to gracefully
 * handle ethers namehash function which can throw.
 *
 * @param namehash - The namehash function to use
 * @param name - The ENS name to hash
 * @returns The namehash hex or `undefined`
 */
export function safeNamehash(namehash: (name: string) => string, name?: string): string | undefined {
  if (name === undefined) {
    return undefined
  }

  try {
    return namehash(name)
  } catch (error) {
    logger.info('safeNamehash', 'safeNamehash', 'error', error, { name })
    return undefined
  }
}
