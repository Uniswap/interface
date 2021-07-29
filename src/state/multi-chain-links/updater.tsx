import { useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import { useActiveWeb3React } from '../../hooks'
import { useIsSwitchingToCorrectChain, useIsSwitchingToCorrectChainUpdater } from './hooks'

export default function Updater(): null {
  const { chainId, connector } = useActiveWeb3React()
  const location = useLocation()
  const history = useHistory()
  const switchingToCorrectChain = useIsSwitchingToCorrectChain()
  const updateSwitchingToCorrectChain = useIsSwitchingToCorrectChainUpdater()

  // this effect updates the chain id in the URL.
  // Scenarios:
  // - If the user lands on Swapr with a chain id already set in the URL, it's because they've followed a multi
  //   chain link. If not connected through a wallet, and if the network is supported, the network
  //   connector will take care of the network switching. If the user is connected, we show him a
  //   wrong network modal. The user can change chain in their wallet as much as they want, but
  //   the chain id in the URL will stay the same as long as they don't switch to the correct network
  //   (the one set in the URL). As soon as the user switches to the right network, the warning modal
  //   goes away and they can then switch to all the other available networks, with the URL updating
  //   accordingly (so that multi-chain links can be shared safely).
  // - If the user lands on a Swapr link without a chain id set in the URL, we set it up for him depending on
  //   the selected network (whether the user has a connected wallet or not).
  useEffect(() => {
    if (!chainId || !location || !connector) return
    const stringChainId = chainId.toString()
    const searchParams = new URLSearchParams(location.search)
    const requiredChainId = searchParams.get('chainId')
    const requiredChainIdSupported =
      requiredChainId &&
      connector.supportedChainIds &&
      connector.supportedChainIds.indexOf(parseInt(requiredChainId)) >= 0

    if (!requiredChainId) updateSwitchingToCorrectChain(false)
    if (requiredChainId && requiredChainIdSupported && switchingToCorrectChain) {
      if (requiredChainId !== stringChainId) return
      else updateSwitchingToCorrectChain(false)
    }

    if (requiredChainId !== stringChainId && !switchingToCorrectChain) {
      searchParams.set('chainId', stringChainId)
      history.replace({ search: searchParams.toString() })
    }
  }, [chainId, connector, history, location, switchingToCorrectChain, updateSwitchingToCorrectChain])

  return null
}
