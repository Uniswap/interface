import { ChainId, useContractKit } from '@celo-tools/use-contractkit'

export const useIsSupportedNetwork = () => {
  const { network } = useContractKit()

  return [ChainId.Mainnet, ChainId.Alfajores].includes(network.chainId)
}
