import { ChainId } from 'src/constants/chains'
import { normalizeAddress } from 'src/utils/addresses'

export function getCaip10Id(address: Address, chainId: ChainId) {
  // Note this assumes all supported chains are using eip155, may need to revisit eventually
  return `eip155:${chainId.toString()}:${normalizeAddress(address)}`
}
