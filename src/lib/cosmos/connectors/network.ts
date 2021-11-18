import { SupportedChainId } from 'constants/chains'
import { initializeConnector } from 'widgets-web3-react/core'
import { Network } from 'widgets-web3-react/network'

export const URLS = {
  [SupportedChainId.MAINNET]: [`https://eth-mainnet.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
  [SupportedChainId.ROPSTEN]: [`https://eth-ropsten.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
  [SupportedChainId.RINKEBY]: [`https://eth-rinkeby.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
  [SupportedChainId.GOERLI]: [`https://eth-goerli.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
  [SupportedChainId.KOVAN]: [`https://eth-kovan.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
  [SupportedChainId.OPTIMISM]: [`https://optimism-mainnet.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
  // [SupportedChainId.POLYGON]: [`https://polygon-mainnet.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
  [SupportedChainId.ARBITRUM_ONE]: [`https://arbitrum-mainnet.alchemyapi.io/v2/-mzwnEVG3Ssm75WVbmsEpYiekfTF3W1z`],
}

export const [network, hooks] = initializeConnector<Network>(
  (actions) => new Network(actions, URLS),
  Object.keys(URLS).map((chainId) => parseInt(chainId, 10))
)
