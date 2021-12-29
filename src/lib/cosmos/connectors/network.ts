import { SupportedChainId } from 'constants/chains'

const ALCHEMY_KEY = '-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z'
const alchemyUrl = (network: string) => `https://${network}.alchemyapi.io/v2/${ALCHEMY_KEY}`

export const URLS = {
  [SupportedChainId.MAINNET]: [alchemyUrl('eth-mainnet')],
  [SupportedChainId.ROPSTEN]: [alchemyUrl('eth-ropsten')],
  [SupportedChainId.RINKEBY]: [alchemyUrl('eth-rinkeby')],
  [SupportedChainId.GOERLI]: [alchemyUrl('eth-goerli')],
  [SupportedChainId.KOVAN]: [alchemyUrl('eth-kovan')],
  [SupportedChainId.OPTIMISM]: [alchemyUrl('optimism-mainnet')],
  [SupportedChainId.ARBITRUM_ONE]: [alchemyUrl('arbitrum-mainnet')],
}
