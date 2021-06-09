import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { BigNumber, utils } from 'ethers'
import { newEstimate } from './actions'
import { ChainId } from '@uniswap/sdk'

let lastChecked = 0
export function shouldCheck(lastBlockNumber: number): boolean {
  if (lastBlockNumber - lastChecked > 2) {
    lastChecked = lastBlockNumber
    return true
  }
  return false
}

export default function Updater() {
  const { chainId, library } = useActiveWeb3React()
  const dispatch = useDispatch<AppDispatch>()

  useEffect(() => {
    fetch('https://www.etherchain.org/api/gasPriceOracle').then(function(response) {
      response.json().then(function(res) {
        // Etherchain returns the rate in "gwei"
        // So we need to convert "gwei" to "wei".

        if (chainId === ChainId.MAINNET) {
          const wei = utils.parseEther(res['fast'].toString()).div(1000000000)
          const fixed = Number(wei.toString()).toFixed(0)
          dispatch(newEstimate({ fast: fixed }))
        }
      })
    })
  })
  useEffect(() => {
    if (!library || chainId === ChainId.MAINNET) return
    library.getGasPrice().then((value: BigNumber) => {
      dispatch(newEstimate({ fast: value.toString() }))
    })
  }, [chainId, library])

  return null
}
