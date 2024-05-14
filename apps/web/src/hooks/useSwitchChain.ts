import { ChainId } from '@uniswap/sdk-core'
import { CHAIN_IDS_TO_NAMES, useIsSupportedChainIdCallback } from 'constants/chains'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'
import { endSwitchingChain, startSwitchingChain } from 'state/wallets/reducer'
import { trace } from 'tracing/trace'

import { useAccount, useSwitchChain as useSwitchChainWagmi } from 'wagmi'

export function useSwitchChain() {
  const dispatch = useAppDispatch()
  const isSupportedChainCallback = useIsSupportedChainIdCallback()
  const { switchChain } = useSwitchChainWagmi()
  const { connector } = useAccount()

  return useCallback(
    (chainId: ChainId) => {
      const isSupportedChain = isSupportedChainCallback(chainId)
      if (!isSupportedChain) {
        throw new Error(`Chain ${chainId} not supported for connector (${connector?.name})`)
      }
      return trace(
        { name: 'Switch chain', op: 'wallet.switch_chain' },
        () =>
          new Promise<void>((resolve, reject) => {
            dispatch(startSwitchingChain(chainId))
            switchChain(
              { chainId },
              {
                onSuccess() {
                  // Because this is async, react-router-dom's useSearchParam's bugs out, and would cause an add'l navigation.
                  // Instead, we modify the window's history directly to append the SearchParams.
                  try {
                    const url = new URL(window.location.href)
                    url.searchParams.set('chain', CHAIN_IDS_TO_NAMES[chainId])
                    window.history.replaceState(window.history.state, '', url)
                  } catch (error) {
                    console.warn('Failed to set SearchParams', error)
                  }
                },
                onSettled(_, error) {
                  dispatch(endSwitchingChain())
                  if (error) {
                    reject(error)
                  } else {
                    resolve()
                  }
                },
              }
            )
          })
      )
    },
    [connector?.name, dispatch, isSupportedChainCallback, switchChain]
  )
}
