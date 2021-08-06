import { CHAIN_INFO } from 'constants/chains'
import useDebounce from 'hooks/useDebounce'
import useIsWindowVisible from 'hooks/useIsWindowVisible'
import { useActiveWeb3React } from 'hooks/web3'
import ms from 'ms.macro'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, CHAIN_TAG } from 'state/data/enhanced'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { supportedChainId } from 'utils/supportedChainId'
import { setChainConnectivityWarning, updateBlockNumber, updateChainId } from './actions'

function useQueryCacheInvalidator() {
  const dispatch = useAppDispatch()

  // subscribe to `chainId` changes in the redux store rather than Web3
  // this will ensure that when `invalidateTags` is called, the latest
  // `chainId` is available in redux to build the subgraph url
  const chainId = useAppSelector((state) => state.application.chainId)

  useEffect(() => {
    dispatch(api.util.invalidateTags([CHAIN_TAG]))
  }, [chainId, dispatch])
}

const NETWORK_HEALTH_CHECK_MS = ms`15s`
const DEFAULT_MS_BEFORE_WARNING_WAIT = ms`10m`
interface UseBlockWarningTimerArgs {
  chainId: number | undefined
  dispatch: (action: any) => void
  msSinceLastBlock: number
  setMsSinceLastBlock: (n: number) => void
}
function useBlockWarningTimer({ chainId, dispatch, msSinceLastBlock, setMsSinceLastBlock }: UseBlockWarningTimerArgs) {
  const chainConnectivityWarningActive = useAppSelector((state) => state.application.chainConnectivityWarning)
  const timeout = useRef<NodeJS.Timeout>()
  useEffect(() => {
    const waitMsBeforeWarning =
      (chainId ? CHAIN_INFO[chainId]?.blockWaitMsBeforeWarning : DEFAULT_MS_BEFORE_WARNING_WAIT) ||
      DEFAULT_MS_BEFORE_WARNING_WAIT

    timeout.current = setTimeout(() => {
      setMsSinceLastBlock(NETWORK_HEALTH_CHECK_MS + msSinceLastBlock)
      if (msSinceLastBlock > waitMsBeforeWarning) {
        dispatch(setChainConnectivityWarning({ warn: true }))
      } else if (chainConnectivityWarningActive) {
        dispatch(setChainConnectivityWarning({ warn: false }))
      }
    }, NETWORK_HEALTH_CHECK_MS)

    return function cleanup() {
      if (timeout.current) {
        clearTimeout(timeout.current)
      }
    }
  }, [chainId, chainConnectivityWarningActive, dispatch, msSinceLastBlock, setMsSinceLastBlock])
}

export default function Updater(): null {
  const { library, chainId } = useActiveWeb3React()
  const dispatch = useAppDispatch()

  const windowVisible = useIsWindowVisible()

  const [state, setState] = useState<{ chainId: number | undefined; blockNumber: number | null }>({
    chainId,
    blockNumber: null,
  })

  useQueryCacheInvalidator()

  const [msSinceLastBlock, setMsSinceLastBlock] = useState(0)
  const blockNumberCallback = useCallback(
    (blockNumber: number) => {
      setState((state) => {
        if (chainId === state.chainId) {
          if (typeof state.blockNumber !== 'number') return { chainId, blockNumber }
          setMsSinceLastBlock(0)
          return { chainId, blockNumber: Math.max(blockNumber, state.blockNumber) }
        }
        return state
      })
    },
    [chainId, setState]
  )

  useBlockWarningTimer({ chainId, dispatch, msSinceLastBlock, setMsSinceLastBlock })

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

  useEffect(() => {
    dispatch(
      updateChainId({ chainId: debouncedState.chainId ? supportedChainId(debouncedState.chainId) ?? null : null })
    )
  }, [dispatch, debouncedState.chainId])

  return null
}
