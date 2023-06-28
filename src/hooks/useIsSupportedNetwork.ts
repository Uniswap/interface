import { ChainId, useCelo } from '@celo/react-celo'

export const useIsSupportedNetwork = () => {
  const { network } = useCelo()

  return [ChainId.Mainnet, ChainId.Alfajores].includes(network.chainId)
}
