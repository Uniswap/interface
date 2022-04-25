import type { CoinbaseWallet } from '@web3-react/coinbase-wallet'
import type { Web3ReactHooks } from '@web3-react/core'
import type { MetaMask } from '@web3-react/metamask'
import { Network } from '@web3-react/network'
import { WalletConnect } from '@web3-react/walletconnect'

const Option = ({
  connector,
  chainId,
  isActivating,
  error,
  isActive,
}: {
  connector: MetaMask | WalletConnect | CoinbaseWallet | Network
  chainId: ReturnType<Web3ReactHooks['useChainId']>
  isActivating: ReturnType<Web3ReactHooks['useIsActivating']>
  error: ReturnType<Web3ReactHooks['useError']>
  isActive: ReturnType<Web3ReactHooks['useIsActive']>
}) => {
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => connector.activate()}>Try Again?</button>
      </div>
    )
  } else if (isActive) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => connector.deactivate()}>Disconnect</button>
      </div>
    )
  } else {
    return (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <button onClick={() => (isActivating ? undefined : connector.activate())} disabled={isActivating}>
          Connect
        </button>
      </div>
    )
  }
}

export default Option
