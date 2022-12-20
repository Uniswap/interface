import { useContractKit } from '@celo-tools/use-contractkit'

import { useAsyncState } from './useAsyncState'

export const useLatestBlockNumber = () => {
  const { kit } = useContractKit()
  return useAsyncState(0, kit.web3.eth.getBlockNumber)
}
