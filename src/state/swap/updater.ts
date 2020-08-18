import { useEffect } from 'react'
import { useActiveWeb3React } from '../../hooks'
import { setSwapFees, setProtocolFee } from './actions'
import { useDispatch } from 'react-redux'
import { Fetcher } from 'dxswap-sdk'
import { getNetwork } from '@ethersproject/networks'
import { getDefaultProvider } from '@ethersproject/providers'


export default function Updater() {
  const { library, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()

  useEffect(() => {
    if (library)
      Promise.all([
        Fetcher.fetchAllSwapFees(chainId, {}, library),
        Fetcher.fetchProtocolFee(chainId, library)
      ]).then(([swapFees, protocolFee]) => {
        console.log(swapFees, protocolFee)
      if (swapFees)
        dispatch(setSwapFees({ swapFees }))
      if (protocolFee)
        dispatch(setProtocolFee({
          protocolFeeDenominator: Number(protocolFee.feeDenominator) + 1,
          protocolFeeTo: protocolFee.feeReceiver,
        }))
      })
  }, [library, chainId])
  
  return null
}
