import { configureStore } from '@reduxjs/toolkit'
import { createMulticall } from '@uniswap/redux-multicall'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useInterfaceMulticall } from 'hooks/useContract'
import { clientSideSORApi } from 'lib/hooks/routing/slice'
import useBlockNumber from 'lib/hooks/useBlockNumber'

const multicall = createMulticall()

export const store = configureStore({
  reducer: {
    multicall: multicall.reducer,
    [clientSideSORApi.reducerPath]: clientSideSORApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      serializableCheck: false,
    }).concat(clientSideSORApi.middleware),
})

export default multicall

export function MulticallUpdater() {
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const contract = useInterfaceMulticall()
  return <multicall.Updater chainId={chainId} latestBlockNumber={latestBlockNumber} contract={contract} />
}
