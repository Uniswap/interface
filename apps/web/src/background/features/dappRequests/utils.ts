import { logger } from 'utilities/src/logger/logger'

export function extractBaseUrl(url?: string): string | undefined {
  if (!url) return undefined
  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.protocol}//${parsedUrl.hostname}${
      parsedUrl.port ? ':' + parsedUrl.port : ''
    }`
  } catch (error) {
    logger.error(error, {
      tags: { file: 'dappRequests/utils', function: 'extractBaseUrl' },
      extra: { url },
    })
  }
}
