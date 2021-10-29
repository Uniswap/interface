import { SupportedChainId } from 'src/constants/chains'

export interface BlockUpdate {
  blockNumber: number
  chainId: SupportedChainId
}
