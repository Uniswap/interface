import uriToHttp from './uriToHttp'

const ENS_URI = /^(\.eth)$/

/**
 *
 * @param uri uri to resolve
 * @param resolveENSContentHash function to resolve the ENS name to its contenthash
 */
export default async function getDataURLs(
  uri: string,
  resolveENSContentHash: (ensName: string) => Promise<string>
): Promise<string[]> {
  if (ENS_URI.test(uri)) {
    return uriToHttp(await resolveENSContentHash(uri))
  }
  return uriToHttp(uri)
}
