import { useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { NETWORKS_INFO, isEVM, isSolana } from 'constants/networks'
import { useActiveWeb3React, useEagerConnect } from 'hooks'

import { useChangeNetwork } from './useChangeNetwork'

export function useSyncNetworkParamWithStore() {
  const params = useParams<{ network?: string }>()
  const changeNetwork = useChangeNetwork()
  const { networkInfo, walletEVM, walletSolana } = useActiveWeb3React()
  const isOnInit = useRef(true)
  const navigate = useNavigate()
  const triedEager = useEagerConnect()

  const location = useLocation()

  useEffect(() => {
    if (!params?.network) {
      isOnInit.current = false
      return
    }
    if (isOnInit.current) {
      const paramChainId = Object.values(NETWORKS_INFO).find(n => n.route === params?.network)?.chainId
      /**
       * Try to change to network on route param on init. Exp: /swap/ethereum => try to connect to ethereum on init
       * @param isOnInit.current: make sure only run 1 time after init
       * @param triedEager: only run after tried to connect injected wallet
       */
      ;(async () => {
        if (paramChainId && isEVM(paramChainId)) {
          await changeNetwork(paramChainId, undefined, () => {
            navigate({ ...location, pathname: location.pathname + '/' + networkInfo.route }, { replace: true })
          })
        } else if (paramChainId && isSolana(paramChainId)) {
          await changeNetwork(paramChainId)
        }
      })()
    }
    isOnInit.current = false
  }, [
    location,
    changeNetwork,
    params?.network,
    navigate,
    networkInfo.route,
    walletEVM.isConnected,
    walletSolana.isConnected,
  ])

  useEffect(() => {
    /**
     * Sync network route param with current active network, only after eager tried
     */
    if (params.network && networkInfo.route !== params?.network && !isOnInit.current && triedEager) {
      navigate(
        { ...location, pathname: location.pathname.replace(params.network, networkInfo.route) },
        { replace: true },
      )
    }
  }, [location, networkInfo.route, navigate, triedEager, params?.network])
}
