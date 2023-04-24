import { ChainId, ChainIdTo } from 'src/constants/chains'

export interface FlashbotsInfo {
  rpcUrl: string
  txApi: string
}

// enable Goerli once Flashbot's Transaction status API is available there
export const FLASHBOTS_URLS: ChainIdTo<FlashbotsInfo> = {
  [ChainId.Mainnet]: {
    rpcUrl: 'https://rpc.flashbots.net',
    txApi: 'https://protect.flashbots.net/tx',
  },
}
