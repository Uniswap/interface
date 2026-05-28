import { hexToUint8 } from '@universe/encoding'
import CID from 'cids'
import { getNameFromData, rmPrefix } from 'multicodec'
import { decode, toB58String } from 'multihashes'

const UTF_8_DECODER = new TextDecoder('utf-8')

/**
 * Returns the URI representation of the content hash for supported codecs
 * @param contenthash to decode
 */
export function contenthashToUri(contenthash: string): string {
  const data = hexToUint8(contenthash)
  const codec = getNameFromData(data)
  switch (codec) {
    case 'ipfs-ns': {
      const unprefixedData = rmPrefix(data)
      const cid = new CID(unprefixedData)
      return `ipfs://${toB58String(cid.multihash)}`
    }
    case 'ipns-ns': {
      const unprefixedData = rmPrefix(data)
      const cid = new CID(unprefixedData)
      const multihash = decode(cid.multihash)
      if (multihash.name === 'identity') {
        return `ipns://${UTF_8_DECODER.decode(multihash.digest).trim()}`
      } else {
        return `ipns://${toB58String(cid.multihash)}`
      }
    }
    default:
      throw new Error(`Unrecognized codec: ${codec}`)
  }
}
