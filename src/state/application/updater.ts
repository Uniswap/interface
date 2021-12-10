import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { MainnetGasPrice, updateBlockNumber, updateMainnetGasPrices, setConnectorInfo } from './actions'
import { useDispatch } from 'react-redux'
import { ChainId } from '@swapr/sdk'

export default function Updater(): null {
  const { library, chainId, account } = useActiveWeb3React()
  const dispatch = useDispatch()

  const windowVisible = useIsWindowVisible()

  const [mainnetGasPrices] = useState<{ [variant in MainnetGasPrice]: string } | null>(null)
  const [state, setState] = useState<{
    chainId: number | undefined
    blockNumber: number | null
  }>({
    chainId,
    blockNumber: null
  })

  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      setState((state: any) => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber }
          return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return state
      })
    },
    [chainId]
  )

  // attach/detach listeners
  useEffect(() => {
    if (!library || !chainId || !windowVisible) return undefined

    setState({ chainId, blockNumber: null })

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
  const debouncedMainnetGasPrices = useDebounce(mainnetGasPrices, 100)

  useEffect(() => {
    if (!windowVisible) return
    dispatch(updateMainnetGasPrices(debouncedState.chainId === ChainId.MAINNET ? debouncedMainnetGasPrices : null))
    if (!debouncedState.chainId || !debouncedState.blockNumber) return
    dispatch(updateBlockNumber({ chainId: debouncedState.chainId, blockNumber: debouncedState.blockNumber }))
  }, [windowVisible, dispatch, debouncedState.blockNumber, debouncedState.chainId, debouncedMainnetGasPrices])

  useEffect(() => {
    if (chainId && account) {
      dispatch(setConnectorInfo({ chainId, account }))
    }
  }, [account, chainId, dispatch])

  return null
}
