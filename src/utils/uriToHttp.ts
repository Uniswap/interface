/**
 * Given a URI that may be ipfs, or http, or an ENS name, return the fetchable http(s) URLs for the same content
 * @param uri to convert to http url
 */
export default function uriToHttp(uri: string): string[] {
  try {
    const parsed = new URL(uri)
    if (parsed.protocol === 'http:') {
      return ['https' + uri.substr(4), uri]
    } else if (parsed.protocol === 'https:') {
      return [uri]
    } else if (parsed.protocol === 'ipfs:') {
      const hash = parsed.href.match(/^ipfs:(\/\/)?(.*)$/)?.[2]
      return [`https://cloudflare-ipfs.com/ipfs/${hash}/`, `https://ipfs.io/ipfs/${hash}/`]
    } else if (parsed.protocol === 'ipns:') {
      const name = parsed.href.match(/^ipns:(\/\/)?(.*)$/)?.[2]
      return [`https://cloudflare-ipfs.com/ipns/${name}/`, `https://ipfs.io/ipns/${name}/`]
    } else {
      return []
    }
  } catch (error) {
    if (uri.toLowerCase().endsWith('.eth')) {
      return [`https://${uri.toLowerCase()}.link`]
    }
    return []
  }
}
