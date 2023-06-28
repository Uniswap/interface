import { useCelo } from '@celo/react-celo'

import { useAsyncState } from './useAsyncState'

export const useLatestBlockNumber = () => {
  const { kit } = useCelo()
  return useAsyncState(0, kit.connection.web3.eth.getBlockNumber)
}
