import { Contract } from '@ethersproject/contracts'
import { JsonRpcProvider } from '@ethersproject/providers'
import { namehash } from 'ethers/lib/utils'
import { contenthashToUri } from './contenthashToUri'

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

// cache the resolvers since most of them are the public resolver
const RESOLVERS: { [address: string]: Contract } = {}
function resolverContract(resolverAddress: string): Contract {
  return (
    RESOLVERS[resolverAddress] ?? (RESOLVERS[resolverAddress] = new Contract(resolverAddress, RESOLVER_ABI, provider))
  )
}

/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 */
export default async function resolveENSContentHash(ensName: string): Promise<string> {
  if (provider === undefined) throw new Error('No network URL')

  const hash = namehash(ensName)
  const resolverAddress = await ensRegistrarContract.resolver(hash)
  const contenthash = await resolverContract(resolverAddress).contenthash(hash)
  return contenthashToUri(contenthash)
}
