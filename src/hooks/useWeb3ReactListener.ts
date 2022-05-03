import { useWeb3React } from '@web3-react/core'
import { Wallet } from 'constants/wallet'
import { useAppDispatch } from 'state/hooks'
import { setWalletOverride } from 'state/user/actions'

import { coinbaseWallet, injected, walletConnect } from '../connectors'
import usePrevious from './usePrevious'

const useWeb3ReactListener = () => {
  const dispatch = useAppDispatch()
  const { hooks, isActive: currentIsActive } = useWeb3React()

  if (!currentIsActive) {
    dispatch(setWalletOverride({ wallet: undefined }))
  }

  const isActiveState = new Map<Wallet, boolean>([
    [Wallet.INJECTED, hooks.useSelectedIsActive(injected)],
    [Wallet.COINBASE_WALLET, hooks.useSelectedIsActive(coinbaseWallet)],
    [Wallet.WALLET_CONNECT, hooks.useSelectedIsActive(walletConnect)],
  ])
  const previousIsActiveState = usePrevious(isActiveState)

  isActiveState.forEach((isActive: boolean, wallet: Wallet) => {
    const previousIsActive = previousIsActiveState?.get(wallet) ?? false
    if (isActive && !previousIsActive) {
      dispatch(setWalletOverride({ wallet }))
    }
  })
}

export default useWeb3ReactListener
