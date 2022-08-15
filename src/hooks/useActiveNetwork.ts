import { ChainId } from '@kyberswap/ks-sdk-core'
import { t } from '@lingui/macro'
import { UnsupportedChainIdError } from '@web3-react/core'
import { stringify } from 'qs'
import { useCallback, useEffect, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router'

import { NETWORKS_INFO, SUPPORTED_NETWORKS } from 'constants/networks'
import { useActiveWeb3React } from 'hooks'
import { updateChainIdWhenNotConnected } from 'state/application/actions'
import { NotificationType, useNotify } from 'state/application/hooks'
import { useAppDispatch } from 'state/hooks'

import useParsedQueryString from './useParsedQueryString'

const getAddNetworkParams = (chainId: ChainId) => ({
  chainId: '0x' + chainId.toString(16),
  chainName: NETWORKS_INFO[chainId].name,
  nativeCurrency: {
    name: NETWORKS_INFO[chainId].nativeToken.symbol,
    symbol: NETWORKS_INFO[chainId].nativeToken.symbol,
    decimals: NETWORKS_INFO[chainId].nativeToken.decimal,
  },
  rpcUrls: [NETWORKS_INFO[chainId].rpcUrl],
  blockExplorerUrls: [NETWORKS_INFO[chainId].etherscanUrl],
})

/**
 * Given a network string (e.g. from user agent), return the best match for corresponding SupportedNetwork
 * @param maybeSupportedNetwork the fuzzy network identifier
 */
function parseNetworkId(maybeSupportedNetwork: string): ChainId | undefined {
  return SUPPORTED_NETWORKS.find(network => network.toString() === maybeSupportedNetwork)
}

export function useActiveNetwork() {
  const { chainId, library, error } = useActiveWeb3React()
  const history = useHistory()
  const location = useLocation()
  const qs = useParsedQueryString()
  const dispatch = useAppDispatch()
  const notify = useNotify()

  const locationWithoutNetworkId = useMemo(() => {
    // Delete networkId from qs object
    const { networkId, ...qsWithoutNetworkId } = qs

    return { ...location, search: stringify({ ...qsWithoutNetworkId }) }
  }, [location, qs])
  const changeNetwork = useCallback(
    async (desiredChainId: ChainId, successCallback?: () => void, failureCallback?: () => void) => {
      const switchNetworkParams = {
        chainId: '0x' + Number(desiredChainId).toString(16),
      }
      const addNetworkParams = getAddNetworkParams(desiredChainId)

      const isNotConnected = !(library && library.provider)
      const isWrongNetwork = error instanceof UnsupportedChainIdError
      if (isNotConnected && !isWrongNetwork) {
        dispatch(updateChainIdWhenNotConnected(desiredChainId))
        return
      }

      history.push(locationWithoutNetworkId)
      const activeProvider = library?.provider ?? window.ethereum
      if (activeProvider && activeProvider.request) {
        try {
          await activeProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [switchNetworkParams],
          })
          successCallback && successCallback()
        } catch (switchError) {
          // This is a workaround solution for Coin98
          const isSwitchError = typeof switchError === 'object' && switchError && Object.keys(switchError)?.length === 0
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError?.code === 4902 || switchError?.code === -32603 || isSwitchError) {
            try {
              await activeProvider.request({ method: 'wallet_addEthereumChain', params: [addNetworkParams] })
              if (chainId !== desiredChainId) {
                notify({
                  title: t`Failed to switch network`,
                  type: NotificationType.ERROR,
                  summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must change the network in your wallet.`,
                })
              }
              successCallback && successCallback()
            } catch (addError) {
              console.error(addError)
              failureCallback && failureCallback()
            }
          } else {
            // handle other "switch" errors
            console.error(switchError)
            failureCallback && failureCallback()
            notify({
              title: t`Failed to switch network`,
              type: NotificationType.ERROR,
              summary: t`In order to use KyberSwap on ${NETWORKS_INFO[desiredChainId].name}, you must change the network in your wallet.`,
            })
          }
        }
      }
    },
    [dispatch, history, library, locationWithoutNetworkId, error, notify, chainId],
  )

  useEffect(() => {
    const urlNetworkId = typeof qs.networkId === 'string' ? parseNetworkId(qs.networkId) : undefined
    if (urlNetworkId && urlNetworkId !== chainId) {
      changeNetwork(urlNetworkId)
    }
  }, [chainId, changeNetwork, qs.networkId])

  return { changeNetwork }
}
