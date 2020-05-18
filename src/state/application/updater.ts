import { useEffect } from 'react'
import { useWeb3React } from '../../hooks'
import { updateBlockNumber } from './actions'
import { useDispatch } from 'react-redux'

export default function Updater() {
  const { library, chainId } = useWeb3React()
  const dispatch = useDispatch()

  // update block number
  useEffect(() => {
    if (!library || !chainId) return

    const blockListener = (blockNumber: number) => {
      dispatch(updateBlockNumber({ chainId, blockNumber }))
    }

    library
      .getBlockNumber()
      .then(blockNumber => updateBlockNumber({ chainId, blockNumber }))
      .catch(error => console.error(`Failed to get block number for chainId ${chainId}`, error))

    library.on('block', blockListener)
    return () => {
      library.removeListener('block', blockListener)
    }
  }, [dispatch, chainId, library])

  return null
}
