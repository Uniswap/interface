import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useMemo } from 'react'
import { InjectedConnector } from 'web3-react-injected-connector'
import { WalletLinkConnector } from 'web3-react-walletlink-connector'

export default function useIsCoinbaseWallet(): boolean {
  const { connector } = useActiveWeb3React()
  return useMemo(() => {
    return (
      connector instanceof WalletLinkConnector ||
      (connector instanceof InjectedConnector && window.walletLinkExtension) ||
      window?.ethereum?.isCoinbaseWallet
    )
  }, [connector])
}
