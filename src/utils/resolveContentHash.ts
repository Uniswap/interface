import { Provider } from '@ethersproject/abstract-provider'

/**
 * Code for using a library to resolve and decode an ENS contenthash
 * @param library library to resolve and decode contenthash
 * @param ensName name to resolve
 */
export default async function resolveContentHash(library: Provider, ensName: string): Promise<string> {
  throw new Error('not yet implemented')
}
