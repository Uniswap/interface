import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../hooks/web3'
import useDebounce from '../../hooks/useDebounce'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { updateBlockNumber } from './actions'
import { useAppDispatch } from 'state/hooks'
import { SupportedChainId } from 'constants/chains'

export default function Updater(): null {
  const { library, chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId,
    blockNumber: null,
  })

  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      setState((state) => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber }
          return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return state
      })
    },
    [chainId, setState]
  )

  // attach/detach listeners
  useEffect(() => {
    if (!library || !chainId || !windowVisible) return undefined

    setState({ chainId, blockNumber: null })

    library
      .getBlockNumber()
      .then(blockNumberCallback)
      .catch((error) => console.error(`Failed to get block number for chainId: ${chainId}`, error))

    library.on('block', blockNumberCallback)
    return () => {
      library.removeListener('block', blockNumberCallback)
    }
  }, [dispatch, chainId, library, blockNumberCallback, windowVisible])

  const debouncedState = useDebounce(state, 100)

  useEffect(() => {
    if (!debouncedState.chainId || !debouncedState.blockNumber || !windowVisible) return
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }))
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId])

  // manage background color
  const background = document.getElementById('background-radial-gradient')
  useEffect(() => {
    if (!background) {
      return
    }

    let gradient
    switch (chainId) {
      case SupportedChainId.ARBITRUM_ONE:
        gradient =
          'radial-gradient(96.19% 96.19% at 50% -5.43%, hsla(204, 87%, 55%, 0.2) 0%, hsla(227, 0%, 0%, 0) 100%)'
        break
      default:
        gradient = 'radial-gradient(50% 50% at 50% 50%, #fc077d10 0%, rgba(255, 255, 255, 0) 100%)'
    }

    background.style.background = gradient
  }, [background, chainId])

  return null
}
