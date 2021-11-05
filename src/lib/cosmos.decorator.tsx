import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'

const [metaMaskConnector, { useChainId, useAccounts, useError, useIsActivating }] = initializeConnector<MetaMask>(
  (actions: any) => new MetaMask(actions)
)
export const Decorator = ({ children }: any) => {
  const isActivating = useIsActivating()
  const chainId = useChainId()
  const accounts = useAccounts()
  const error = useError()
  const connected = Boolean(chainId && accounts)

  return (
    <>
      <header>
        <div>accounts:&nbsp;{accounts}</div>
        <div>chainId:&nbsp;{chainId}</div>
        <div>connected:&nbsp;{connected}</div>
        <div>error:&nbsp;{error}</div>
        <div>
          <div>controls</div>
          <button
            onClick={() => {
              if (!isActivating) {
                metaMaskConnector.activate()
              }
            }}
            disabled={isActivating ? true : false}
          >
            {isActivating ? 'Connecting...' : 'Activate'}
          </button>
        </div>
      </header>
      <div>{children}</div>
    </>
  )
}
