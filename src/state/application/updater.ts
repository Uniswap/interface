import { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useActiveWeb3React, useWeb3React, useWeb3Solana } from 'hooks'
import useDebounce from 'hooks/useDebounce'
import useIsWindowVisible from 'hooks/useIsWindowVisible'

import { updateBlockNumber } from './actions'

export default function Updater(): null {
  const { chainId, isEVM, isSolana } = useActiveWeb3React()
  const { library } = useWeb3React()
  const dispatch = useDispatch()
  const { connection } = useWeb3Solana()

  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId,
    blockNumber: null,
  })

  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      setState(state => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber }
          return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return state
      })
    },
    [chainId, setState],
  )

  // attach/detach listeners
  useEffect(() => {
    if (!library || !windowVisible || !isEVM) return undefined

    setState({ chainId, blockNumber: null })

    library
      .getBlockNumber()
      .then(blockNumberCallback)
      .catch((error: any) => console.error(`Failed to get block number for chainId: ${chainId}`, error))

    library.on('block', blockNumberCallback)
    return () => {
      library.removeListener('block', blockNumberCallback)
    }
  }, [dispatch, chainId, library, blockNumberCallback, windowVisible, isEVM])

  useEffect(() => {
    if (!windowVisible || !isSolana || !connection) return undefined

    setState({ chainId, blockNumber: null })

    const intervalToken = setInterval(async () => {
      try {
        const blockHeight = await connection.getBlockHeight()
        blockNumberCallback(blockHeight)
      } catch {}
    }, 2000)

    return () => {
      clearInterval(intervalToken)
    }
  }, [blockNumberCallback, chainId, isSolana, windowVisible, connection])

  const debouncedState = useDebounce(state, 100)

  useEffect(() => {
    if (!debouncedState.chainId || !debouncedState.blockNumber || !windowVisible) return
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }))
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId])

  return null
}
