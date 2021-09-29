import { ChainId, useContractKit } from '@celo-tools/use-contractkit'

export const useIsSupportedNetwork = () => {
  const { network } = useContractKit()

  return [ChainId.CeloMainnet, ChainId.Alfajores].includes(network.chainId)
}
