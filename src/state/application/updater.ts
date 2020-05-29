import { useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { updateBlockNumber } from './actions'
import { useDispatch } from 'react-redux'

export default function Updater() {
  const { library, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()

  const windowVisible = useIsWindowVisible()
  const [maxBlockNumber, setMaxBlockNumber] = useState<number | null>(null)
  // because blocks arrive in bunches with longer polling periods, we just want
  // to process the latest one.
  const debouncedMaxBlockNumber = useDebounce<number | null>(maxBlockNumber, 100)

  // update block number
  useEffect(() => {
    if (!library || !chainId) return

    const blockListener = (blockNumber: number) => {
      setMaxBlockNumber(maxBlockNumber => {
        if (typeof maxBlockNumber !== 'number') return blockNumber
        return Math.max(maxBlockNumber, blockNumber)
      })
    }

    setMaxBlockNumber(null)

    library
      .getBlockNumber()
      .then(blockNumber => dispatch(updateBlockNumber({ chainId, blockNumber })))
      .catch(error => console.error(`Failed to get block number for chainId ${chainId}`, error))

    library.on('block', blockListener)
    return () => {
      library.removeListener('block', blockListener)
    }
  }, [dispatch, chainId, library])

  useEffect(() => {
    if (!chainId || !debouncedMaxBlockNumber) return
    if (windowVisible) {
      dispatch(updateBlockNumber({ chainId, blockNumber: debouncedMaxBlockNumber }))
    }
  }, [chainId, debouncedMaxBlockNumber, windowVisible, dispatch])

  return null
}
