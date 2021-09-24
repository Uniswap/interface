import { useCallback, useEffect, useState } from 'react'
import { useActiveWeb3React } from '../../hooks'
import useDebounce from '../../hooks/useDebounce'
import useIsWindowVisible from '../../hooks/useIsWindowVisible'
import { MainnetGasPrice, updateBlockNumber, updateMainnetGasPrices } from './actions'
import { useDispatch } from 'react-redux'
import { ChainId } from '@swapr/sdk'
import { useBridge } from '../../hooks/useArbBridge'

type BlockNumberByChain = {
  chainId: number | undefined
  blockNumber: number | null
}

export default function Updater(): null {
  const {
    bridge,
    chainIdPair: { l1ChainId, l2ChainId }
  } = useBridge()
  const { library, chainId } = useActiveWeb3React()
  const dispatch = useDispatch()
  const windowVisible = useIsWindowVisible()

  const [mainnetGasPrices, setMainnetGasPrices] = useState<{ [variant in MainnetGasPrice]: string } | null>(null)

  const [l1state, setL1State] = useState<BlockNumberByChain>({
    chainId: l1ChainId,
    blockNumber: null
  })

  const [l2state, setL2State] = useState<BlockNumberByChain>({
    chainId: l2ChainId,
    blockNumber: null
  })

  const blockNumberCallback = useCallback(
    (blockNumber: number, setter: React.Dispatch<React.SetStateAction<BlockNumberByChain>>) => {
      setter((state: BlockNumberByChain) => {
        if (chainId) {
          const resolvedChainId = state.chainId === l1ChainId ? l1ChainId : l2ChainId

          if (typeof state.blockNumber !== 'number') return { chainId: resolvedChainId, blockNumber }
          return { chainId: resolvedChainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return state
      })
    },
    [chainId, l1ChainId, l2ChainId]
  )

  const l1BlockNumberCallback = useCallback((blockNumber: number) => blockNumberCallback(blockNumber, setL1State), [
    blockNumberCallback
  ])

  const l2BlockNumberCallback = useCallback((blockNumber: number) => blockNumberCallback(blockNumber, setL2State), [
    blockNumberCallback
  ])

  const gasPriceCallback = useCallback((gasPrices: { rapid: number; fast: number; standard: number } | null) => {
    if (!gasPrices) {
      setMainnetGasPrices(null)
      return
    }
    setMainnetGasPrices({
      [MainnetGasPrice.INSTANT]: gasPrices.rapid.toString(),
      [MainnetGasPrice.FAST]: gasPrices.fast.toString(),
      [MainnetGasPrice.NORMAL]: gasPrices.standard.toString()
    })
  }, [])

  // attach/detach listeners
  useEffect(() => {
    if (!bridge || !chainId || !windowVisible) return undefined
    const { l1Provider, l2Provider } = bridge

    setL1State({ chainId: l1ChainId, blockNumber: null })

    if (l2ChainId) {
      setL2State({ chainId: l2ChainId, blockNumber: null })
    }

    l1Provider
      .getBlockNumber()
      .then((blockNumber: number) => l1BlockNumberCallback(blockNumber))
      .catch(error => console.error(`Failed to get block number for chainId: ${chainId}`, error))

    l1Provider.on('block', l1BlockNumberCallback)

    if (l2ChainId) {
      l2Provider
        .getBlockNumber()
        .then((blockNumber: number) => l2BlockNumberCallback(blockNumber))
        .catch(error => console.error(`Failed to get block number for chainId: ${chainId}`, error))

      l2Provider.on('block', l2BlockNumberCallback)
    }

    let gasWebsocket: WebSocket | null = null
    if (l1ChainId === ChainId.MAINNET) {
      gasWebsocket = new WebSocket('wss://www.gasnow.org/ws/gasprice')
      gasWebsocket.onmessage = event => {
        const data = JSON.parse(event.data)
        if (data.type) {
          gasPriceCallback(data.data)
        }
      }
      gasWebsocket.onerror = event => {
        console.error(event)
        gasPriceCallback(null)
      }
    }

    return () => {
      l1Provider.removeListener('block', l1BlockNumberCallback)
      if (l2ChainId) {
        l2Provider.removeListener('block', l2BlockNumberCallback)
      }
      if (gasWebsocket) gasWebsocket.close()
    }
  }, [
    dispatch,
    chainId,
    library,
    blockNumberCallback,
    windowVisible,
    gasPriceCallback,
    bridge,
    l1BlockNumberCallback,
    l2BlockNumberCallback,
    l1ChainId,
    l2ChainId
  ])

  const debouncedL1State = useDebounce(l1state, 100)
  const debouncedL2State = useDebounce(l2state, 100)
  const debouncedMainnetGasPrices = useDebounce(mainnetGasPrices, 100)

  useEffect(() => {
    if (!windowVisible) return
    dispatch(updateMainnetGasPrices(debouncedL1State.chainId === ChainId.MAINNET ? debouncedMainnetGasPrices : null))
    if (!debouncedL1State.chainId || !debouncedL1State.blockNumber) return
    dispatch(updateBlockNumber({ chainId: debouncedL1State.chainId, blockNumber: debouncedL1State.blockNumber }))

    if (debouncedL2State.chainId && debouncedL2State.blockNumber) {
      dispatch(updateBlockNumber({ chainId: debouncedL2State.chainId, blockNumber: debouncedL2State.blockNumber }))
    }
  }, [
    windowVisible,
    dispatch,
    debouncedMainnetGasPrices,
    debouncedL1State.chainId,
    debouncedL1State.blockNumber,
    debouncedL2State.chainId,
    debouncedL2State.blockNumber
  ])

  return null
}
