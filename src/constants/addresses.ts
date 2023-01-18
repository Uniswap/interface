// Copied from https://github.com/Uniswap/interface/blob/main/src/constants/addresses.ts
import { ChainId, L1_CHAIN_IDS } from 'src/constants/chains'

type AddressMap<T extends readonly ChainId[]> = Record<ValuesOf<T>, string>

const SUPPORTED_L1_L2_CHAINS = [
  ChainId.Optimism,
  ChainId.ArbitrumOne,
  ChainId.Polygon,
  ChainId.PolygonMumbai,
]

/** Address that represents native currencies on ETH, Polygon, etc. */
export const NATIVE_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

export const MATIC_MAINNET_ADDRESS = '0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0'

/** Alternative address used to denote a native currency (e.g. MATIC on Polygon) */
export const NATIVE_ADDRESS_ALT = '0x0000000000000000000000000000000000001010'

export const UNI_ADDRESS = constructSameAddressMap(
  '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
) as AddressMap<typeof L1_CHAIN_IDS>

export const SWAP_ROUTER_ADDRESSES = constructSameAddressMap(
  '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
  SUPPORTED_L1_L2_CHAINS
) as AddressMap<typeof SUPPORTED_L1_L2_CHAINS> & AddressMap<typeof L1_CHAIN_IDS>

function constructSameAddressMap<T extends string>(
  address: T,
  additionalNetworks: ChainId[] = []
): { [chainId: number]: T } {
  return (L1_CHAIN_IDS as readonly ChainId[])
    .concat(additionalNetworks)
    .reduce<{ [chainId: number]: T }>((memo, chainId) => {
      memo[chainId] = address
      return memo
    }, {})
}
