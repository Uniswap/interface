import { BalanceMap, getEtherBalances } from '@mycrypto/eth-scan'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWeb3React } from '../../hooks'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { updateEtherBalances } from './actions'
import { balanceKey } from './reducer'

function convertBalanceMapValuesToString(balanceMap: BalanceMap): { [key: string]: string } {
  return Object.keys(balanceMap).reduce<{ [key: string]: string }>((map, key) => {
    map[key] = balanceMap[key].toString()
    return map
  }, {})
}

export default function Updater() {
  const { chainId, account, library } = useWeb3React()
  const lastBlockNumber = useBlockNumber()
  const dispatch = useDispatch<AppDispatch>()
  const ethBalanceListeners = useSelector<AppState>(state => {
    return state.wallet.balanceListeners
  })
  const tokenBalanceListeners = useSelector<AppState>(state => {
    return state.wallet.tokenBalanceListeners
  })
  const allBalances = useSelector<AppState>(state => state.wallet.balances)

  const activeETHListeners: string[] = useMemo(() => {
    return Object.keys(ethBalanceListeners).filter(address => ethBalanceListeners[address] > 0) // redundant check
  }, [ethBalanceListeners])

  const activeTokenBalanceListeners: { [address: string]: string[] } = useMemo(() => {
    return Object.keys(tokenBalanceListeners).reduce<{ [address: string]: string[] }>((map, address) => {
      const tokenAddresses = Object.keys(tokenBalanceListeners[address]).filter(
        tokenAddress => tokenBalanceListeners[address][tokenAddress] > 0 // redundant check
      )
      map[address] = tokenAddresses
      return map
    }, {})
  }, [tokenBalanceListeners])

  const ethBalancesNeedUpdate: string[] = useMemo(() => {
    return activeETHListeners.filter(address => {
      const data = allBalances[balanceKey({ chainId, address })]
      return !data || data.blockNumber < lastBlockNumber
    })
  }, [activeETHListeners, allBalances])

  useEffect(() => {
    getEtherBalances(library, ethBalancesNeedUpdate)
      .then(balanceMap => {
        dispatch(
          updateEtherBalances({
            blockNumber: lastBlockNumber,
            chainId,
            etherBalances: convertBalanceMapValuesToString(balanceMap)
          })
        )
      })
      .catch(error => {
        console.error('balance fetch failed', error)
      })
  }, [library, ethBalancesNeedUpdate, dispatch, lastBlockNumber])

  return null
}
