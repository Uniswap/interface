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
      const hash = parsed.pathname.substring(2)
      return [`https://cloudflare-ipfs.com/ipfs/${hash}/`, `https://ipfs.infura.io/ipfs/${hash}/`]
    } else if (parsed.protocol === 'ipns:') {
      const name = parsed.pathname.substring(2)
      return [`https://cloudflare-ipfs.com/ipns/${name}/`, `https://ipfs.infura.io/ipns/${name}/`]
    } else {
      console.error('Unrecognized protocol', parsed)
      return []
    }
  } catch (error) {
    if (uri.toLowerCase().endsWith('.eth')) {
      return [`https://${uri.toLowerCase()}.link`]
    }
    console.error('Failed to parse URI', error)
    return []
  }
}
