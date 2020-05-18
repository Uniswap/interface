import { BalanceMap, getEtherBalances, getTokensBalance } from '@mycrypto/eth-scan'
import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useWeb3React } from '../../hooks'
import { useBlockNumber } from '../application/hooks'
import { AppDispatch, AppState } from '../index'
import { updateEtherBalances, updateTokenBalances } from './actions'
import { balanceKey } from './reducer'

function convertBalanceMapValuesToString(balanceMap: BalanceMap): { [key: string]: string } {
  return Object.keys(balanceMap).reduce<{ [key: string]: string }>((map, key) => {
    map[key] = balanceMap[key].toString()
    return map
  }, {})
}

export default function Updater() {
  const { chainId, library } = useWeb3React()
  const lastBlockNumber = useBlockNumber()
  const dispatch = useDispatch<AppDispatch>()
  const ethBalanceListeners = useSelector<AppState, AppState['wallet']['balanceListeners']>(state => {
    return state.wallet.balanceListeners
  })
  const tokenBalanceListeners = useSelector<AppState, AppState['wallet']['tokenBalanceListeners']>(state => {
    return state.wallet.tokenBalanceListeners
  })
  const allBalances = useSelector<AppState, AppState['wallet']['balances']>(state => state.wallet.balances)

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
    if (!chainId || !lastBlockNumber) return []
    return activeETHListeners.filter(address => {
      const data = allBalances[balanceKey({ chainId, address })]
      if (!data || !data.blockNumber) return true
      return data.blockNumber < lastBlockNumber
    })
  }, [activeETHListeners, allBalances, chainId, lastBlockNumber])

  const tokenBalancesNeedUpdate: { [address: string]: string[] } = useMemo(() => {
    if (!chainId || !lastBlockNumber) return {}
    return Object.keys(activeTokenBalanceListeners).reduce<{ [address: string]: string[] }>((map, address) => {
      const needsUpdate =
        activeTokenBalanceListeners[address]?.filter(tokenAddress => {
          const data = allBalances[balanceKey({ chainId, tokenAddress, address })]
          if (!data || !data.blockNumber) return true
          return data.blockNumber < lastBlockNumber
        }) ?? []
      if (needsUpdate.length > 0) {
        map[address] = needsUpdate
      }
      return map
    }, {})
  }, [activeTokenBalanceListeners, allBalances, chainId, lastBlockNumber])

  useEffect(() => {
    if (!library || !chainId || !lastBlockNumber || ethBalancesNeedUpdate.length === 0) return
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
        console.error('balance fetch failed', ethBalancesNeedUpdate, error)
      })
  }, [library, ethBalancesNeedUpdate, dispatch, lastBlockNumber, chainId])

  useEffect(() => {
    if (!library || !chainId || !lastBlockNumber) return
    Object.keys(tokenBalancesNeedUpdate).forEach(address => {
      if (tokenBalancesNeedUpdate[address].length === 0) return
      getTokensBalance(library, address, tokenBalancesNeedUpdate[address])
        .then(tokenBalanceMap => {
          dispatch(
            updateTokenBalances({
              address,
              chainId,
              blockNumber: lastBlockNumber,
              tokenBalances: convertBalanceMapValuesToString(tokenBalanceMap)
            })
          )
        })
        .catch(error => {
          console.error(`failed to get token balances`, address, tokenBalancesNeedUpdate[address], error)
        })
    })
  }, [library, tokenBalancesNeedUpdate, dispatch, lastBlockNumber, chainId])

  return null
}
