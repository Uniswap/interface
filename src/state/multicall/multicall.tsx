import { useInterfaceMulticall } from 'hooks/useContract'
import { useActiveWeb3React } from 'hooks/web3'
import { combineReducers, createStore } from 'redux'
import { useBlockNumber } from 'state/application/hooks'
import { createMulticall } from '@uniswap/redux-multicall'
const multicall = createMulticall()
const reducer = combineReducers({ [multicall.reducerPath]: multicall.reducer })
export const store = createStore(reducer)

export default multicall

export function MulticallUpdater() {
  const latestBlockNumber = useBlockNumber()
  const { chainId } = useActiveWeb3React()
  const contract = useInterfaceMulticall()
  return <multicall.Updater chainId={chainId} latestBlockNumber={latestBlockNumber} contract={contract} />
}