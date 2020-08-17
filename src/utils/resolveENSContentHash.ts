import { namehash } from 'ethers/lib/utils'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Contract } from '@ethersproject/contracts'
import { decode, getCodec } from 'content-hash'
const NETWORK_URL = process.env.REACT_APP_NETWORK_URL

const provider: JsonRpcProvider | undefined = NETWORK_URL ? new JsonRpcProvider(NETWORK_URL) : undefined
const ensRegistrarContract = new Contract(
  '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
  [
    {
      constant: true,
      inputs: [
        {
          name: 'node',
          type: 'bytes32'
        }
      ],
      name: 'resolver',
      outputs: [
        {
          name: 'resolverAddress',
          type: 'address'
        }
      ],
      payable: false,
      stateMutability: 'view',
      type: 'function'
    }
  ],
  provider
)

const RESOLVER_ABI = [
  {
    constant: true,
    inputs: [
      {
        internalType: 'bytes32',
        name: 'node',
        type: 'bytes32'
      }
    ],
    name: 'contenthash',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes'
      }
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  }
]

/**
 * Returns the URI representation of the content hash for supported codecs
 * @param contenthash to decode
 */
export function contenthashToUri(contenthash: string): string {
  const codec = getCodec(contenthash)
  switch (codec) {
    case 'ipns-ns':
      const ipns = decode(contenthash)
      return `ipns://${ipns}`
    case 'ipfs-ns':
      const ipfs = decode(contenthash)
      return `ipfs://${ipfs}`
    default:
      throw new Error(`Unrecognized codec: ${codec}`)
  }
}

/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 */
export default async function resolveENSContentHash(ensName: string): Promise<string> {
  if (provider === undefined) throw new Error('No network URL')

  const hash = namehash(ensName)
  const resolver = await ensRegistrarContract.resolver(hash)
  const resolverContract = new Contract(resolver, RESOLVER_ABI, provider)
  const contenthash = await resolverContract.contenthash(hash)
  return contenthashToUri(contenthash)
}
