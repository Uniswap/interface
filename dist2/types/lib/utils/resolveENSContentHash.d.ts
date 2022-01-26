import { Provider } from '@ethersproject/abstract-provider';
/**
 * Fetches and decodes the result of an ENS contenthash lookup on mainnet to a URI
 * @param ensName to resolve
 * @param provider provider to use to fetch the data
 */
export default function resolveENSContentHash(ensName: string, provider: Provider): Promise<string>;
