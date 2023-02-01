import { useWallet } from '@solana/wallet-adapter-react'
import { useCallback } from 'react'

import { SUPPORTED_WALLETS } from 'constants/wallets'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useIsUserManuallyDisconnect } from 'state/user/hooks'
import { isEVMWallet, isSolanaWallet } from 'utils'

const useDisconnectWallet = () => {
  const [, setIsUserManuallyDisconnect] = useIsUserManuallyDisconnect()
  const { disconnect } = useWallet()
  const { walletKey, isEVM, isSolana } = useActiveWeb3React()
  const { connector, deactivate } = useWeb3React()
  return useCallback(() => {
    const wallet = walletKey && SUPPORTED_WALLETS[walletKey]
    //If wallet support both network, disconnect to both
    if (wallet && isEVMWallet(wallet) && isSolanaWallet(wallet)) {
      deactivate()
      disconnect()
      return
    }

    if (isEVM) {
      deactivate()
      // @ts-expect-error close can be returned by wallet
      if (connector && connector.close) connector.close()
    } else if (isSolana) {
      disconnect()
    }
    setIsUserManuallyDisconnect(true)
  }, [connector, deactivate, disconnect, isEVM, isSolana, setIsUserManuallyDisconnect, walletKey])
}
export default useDisconnectWallet
