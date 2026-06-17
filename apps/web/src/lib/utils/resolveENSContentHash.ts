import type { JsonRpcProvider } from '@ethersproject/providers'
import { ensure0xHex } from '@universe/encoding'
import { type Address, createContract, ensPublicResolverAbi, ensRegistrarAbi, namehash } from '~/chains'
import { safeNamehash } from '~/utils/safeNamehash'

const REGISTRAR_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const

function resolverContract(resolverAddress: Address, provider: JsonRpcProvider) {
  return createContract({ address: resolverAddress, abi: ensPublicResolverAbi, provider })
}

/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 * @param provider provider to use to fetch the data
 */
export async function resolveENSContentHash(ensName: string, provider: JsonRpcProvider): Promise<string> {
  const hash = safeNamehash(namehash, ensName)
  if (!hash) {
    throw new Error(`Invalid ENS name: ${ensName}`)
  }
  const node = ensure0xHex(hash)
  const registrar = createContract({ address: REGISTRAR_ADDRESS, abi: ensRegistrarAbi, provider })
  const resolverAddress = await registrar.read.resolver([node])
  return resolverContract(resolverAddress, provider).read.contenthash([node])
}
