import { SupportedChainId } from 'constants/chains'
import { RPC_URLS } from 'constants/networks'

export const ROUTER_URL = 'https://api.uniswap.org/v1/'
export const RPC_URL_MAP = Object.keys(RPC_URLS).reduce(
  (acc, cur) => ({ ...acc, [cur]: [RPC_URLS[cur as unknown as SupportedChainId]] }),
  {}
)
