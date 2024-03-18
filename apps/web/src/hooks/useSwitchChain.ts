import { ChainId } from '@uniswap/sdk-core'
import { Connector } from '@web3-react/types'
import {
  deprecatedNetworkConnection,
  networkConnection,
  uniwalletWCV2ConnectConnection,
  walletConnectV2Connection,
} from 'connection'
import { getChainInfo } from 'constants/chainInfo'
import { CHAIN_IDS_TO_NAMES, isSupportedChain } from 'constants/chains'
import { PUBLIC_RPC_URLS } from 'constants/networks'
import { useCallback } from 'react'
import { useAppDispatch } from 'state/hooks'
import { endSwitchingChain, startSwitchingChain } from 'state/wallets/reducer'
import { trace } from 'tracing/trace'

export function useSwitchChain() {
  const dispatch = useAppDispatch()

  return useCallback(
    (connector: Connector, chainId: ChainId) => {
      if (!isSupportedChain(chainId)) {
        throw new Error(`Chain ${chainId} not supported for connector (${typeof connector})`)
      } else {
        return trace({ name: 'Switch chain', op: 'wallet.switch_chain' }, async (trace) => {
          dispatch(startSwitchingChain(chainId))
          try {
            if (
              [
                walletConnectV2Connection.connector,
                uniwalletWCV2ConnectConnection.connector,
                networkConnection.connector,
                deprecatedNetworkConnection.connector,
              ].includes(connector)
            ) {
              await connector.activate(chainId)
            } else {
              const info = getChainInfo(chainId)
              const addChainParameter = {
                chainId,
                chainName: info.label,
                // Attempting to add a chain using an application-specific URL will not work, as the URL will be unreachable from the MetaMask background page.
                // MetaMask allows switching to any publicly reachable URL, but for novel chains, it will display a warning if it is not on the "Safe" list.
                // See the definition of PUBLIC_RPC_URLS for more details.
                rpcUrls: [PUBLIC_RPC_URLS[chainId][0]],
                nativeCurrency: info.nativeCurrency,
                blockExplorerUrls: [info.explorer],
              }
              await connector.activate(addChainParameter)
            }
            if (isSupportedChain(chainId)) {
              // Because this is async, react-router-dom's useSearchParam's bugs out, and would cause an add'l navigation.
              // Instead, we modify the window's history directly to append the SearchParams.
              try {
                const url = new URL(window.location.href)
                url.searchParams.set('chain', CHAIN_IDS_TO_NAMES[chainId])
                window.history.replaceState(window.history.state, '', url)
              } catch (error) {
                console.warn('Failed to set SearchParams', error)
              }
            }
          } catch (error) {
            trace.setError(error)
            // In activating a new chain, the connector passes through a deactivated state.
            // If we fail to switch chains, it may remain in this state, and no longer be usable.
            // We defensively re-activate the connector to ensure the user does not notice any change.
            try {
              await connector.activate()
            } catch (error) {
              console.error('Failed to re-activate connector', error)
            }
            throw error
          } finally {
            dispatch(endSwitchingChain())
          }
        })
      }
    },
    [dispatch]
  )
}
