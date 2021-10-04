import { SupportedChainId } from 'src/constants/chains'
import { Address } from 'src/utils/Address'

export function getCaip10Id(address: Address | string, chainId: SupportedChainId) {
  const addressString = typeof address === 'string' ? address : address.toString()
  // Note this assumes all supported chains are using eip155, may need to revisit eventually
  return `eip155:${chainId.toString()}:${addressString}`
}
