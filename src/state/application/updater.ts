import { useEffect } from 'react'
import { useWeb3React } from '../../hooks'
import { updateBlockNumber } from './actions'
import { useDispatch } from 'react-redux'

export function Updater() {
  const { library, chainId } = useWeb3React()
  const dispatch = useDispatch()

  // update block number
  useEffect(() => {
    if (library) {
      let stale = false

      const update = () => {
        library
          .getBlockNumber()
          .then(blockNumber => {
            if (!stale) {
              dispatch(updateBlockNumber({ networkId: chainId, blockNumber }))
            }
          })
          .catch(() => {
            if (!stale) {
              dispatch(updateBlockNumber({ networkId: chainId, blockNumber: null }))
            }
          })
      }

      update()
      library.on('block', update)

      return () => {
        stale = true
        library.removeListener('block', update)
      }
    }
  }, [dispatch, chainId, library])

  return null
}
