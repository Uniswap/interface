import { useEffect } from 'react'
import { useDispatch } from 'react-redux'

import { useActiveWeb3React } from 'hooks'

import { resetErrorNFTs } from './actions'

function Updater() {
  const { account, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(resetErrorNFTs())
  }, [account, chainId])
  return null
}

export default Updater
