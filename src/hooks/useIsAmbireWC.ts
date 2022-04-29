import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { WalletConnectConnector } from 'web3-react-walletconnect-connector'

export default function useIsAmbireWC(): boolean {
  const res = useActiveWeb3React()
  const wcConnector = res?.connector as WalletConnectConnector
  return wcConnector?.walletConnectProvider?.signer?.connection?.wc?._peerMeta?.name === 'Ambire Wallet'
}
