// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/uriToHttp.ts

/**
 * Given a URI that may be ipfs, ipns, http, or https protocol, return the fetch-able http(s) URLs for the same content
 * @param uri to convert to fetch-able http url
 */
export function uriToHttp(uri: string): string[] {
  if (!uri) {
    return []
  }

  const protocol = uri.split(':')[0]?.toLowerCase()
  if (protocol === 'https') {
    return [uri]
  }
  if (protocol === 'http') {
    return ['https' + uri.slice(4), uri]
  }
  if (protocol === 'ipfs') {
    const hash = uri.match(/^ipfs:(\/\/)?(ipfs\/)?(.*)$/i)?.[3]
    return [`https://cloudflare-ipfs.com/ipfs/${hash}`, `https://ipfs.io/ipfs/${hash}`]
  }
  if (protocol === 'ipns') {
    const name = uri.match(/^ipns:(\/\/)?(.*)$/i)?.[2]
    return [`https://cloudflare-ipfs.com/ipns/${name}`, `https://ipfs.io/ipns/${name}`]
  }

  return []
}

export function isSVGUri(uri: Maybe<string>): boolean {
  return uri?.includes('.svg') ?? false
}
