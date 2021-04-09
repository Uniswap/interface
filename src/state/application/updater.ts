import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { updateBlockGasLimit, updateBlockNumber } from './actions'
import { useDispatch } from 'react-redux'
import { BigNumber } from 'ethers'

export default function Updater(): null {
  const { library, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()

  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{
    chainId: number | undefined
    blockNumber: number | null
    blockGasLimit: BigNumber | null
  }>({
    chainId,
    blockNumber: null,
    blockGasLimit: null
  })

  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      library?.getBlock(blockNumber).then(block => {
        setState((state: any) => {
          if (chainId === state.chainId) {
            if (typeof state.blockNumber !== 'number') return { chainId, blockNumber, blockGasLimit: block.gasLimit }
            return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber), blockGasLimit: block.gasLimit }
          }
          return state
        })
      })
    },
    [chainId, library]
  )

  // attach/detach listeners
  useEffect(() => {
    if (!library || !chainId || !windowVisible) return undefined

    setState({ chainId, blockNumber: null, blockGasLimit: null })

    library
      .getBlockNumber()
      .then(blockNumberCallback)
      .catch(error => console.error(`Failed to get block number for chainId: ${chainId}`, error))

    library.on('block', blockNumberCallback)
    return () => {
      library.removeListener('block', blockNumberCallback)
    }
  }, [dispatch, chainId, library, blockNumberCallback, windowVisible])

  const debouncedState = useDebounce(state, 100)

  useEffect(() => {
    if (!debouncedState.chainId || !debouncedState.blockNumber || !debouncedState.blockGasLimit || !windowVisible)
      return
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }))
    dispatch(
      updateBlockGasLimit({
        chainId: debouncedState.chainId,
        blockGasLimit: debouncedState.blockGasLimit.toHexString()
      })
    )
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId, debouncedState.blockGasLimit])

  return null
}
