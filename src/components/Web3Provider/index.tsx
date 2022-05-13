import { useWeb3React, Web3ReactProvider } from '@web3-react/core'
import { coinbaseWallet, injected, walletConnect } from 'connectors'
import { connectors } from 'connectors'
import { getConnectorForWallet, Wallet } from 'constants/wallet'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateWalletOverride } from 'state/user/reducer'

interface ConnectorState {
  isActive: boolean
  previousIsActive: boolean | undefined
  isActivating: boolean
  isEagerlyConnecting: boolean
  setIsEagerlyConnecting(connecting: boolean): void
}

const Web3Updater = () => {
  const dispatch = useAppDispatch()
  const { hooks } = useWeb3React()

  const walletOverrideBackfilled = useAppSelector((state) => state.user.walletOverrideBackfilled)

  const injectedIsActive = hooks.useSelectedIsActive(injected)
  const coinbaseWalletIsActive = hooks.useSelectedIsActive(coinbaseWallet)
  const walletConnectIsActive = hooks.useSelectedIsActive(walletConnect)

  const previousInjectedIsActive = usePrevious(injectedIsActive)
  const previousCoinbaseWalletIsActive = usePrevious(coinbaseWalletIsActive)
  const previousWalletConnectIsActive = usePrevious(walletConnectIsActive)

  const injectedIsActivating = hooks.useSelectedIsActivating(injected)
  const coinbaseWalletIsActivating = hooks.useSelectedIsActivating(coinbaseWallet)
  const walletConnectIsActivating = hooks.useSelectedIsActivating(walletConnect)

  const [isInjectedEagerlyConnecting, setIsInjectedEagerlyConnecting] = useState(false)
  const [isCoinbaseWalletEagerlyConnecting, setIsCoinbaseWalletEagerlyConnecting] = useState(false)
  const [isWalletConnectEagerlyConnecting, setIsWalletConnectEagerlyConnecting] = useState(false)

  useEffect(() => {
    const injectedState: ConnectorState = {
      isActive: injectedIsActive,
      previousIsActive: previousInjectedIsActive,
      isActivating: injectedIsActivating,
      isEagerlyConnecting: isInjectedEagerlyConnecting,
      setIsEagerlyConnecting: setIsInjectedEagerlyConnecting,
    }
    const coinbaseWalletState: ConnectorState = {
      isActive: coinbaseWalletIsActive,
      previousIsActive: previousCoinbaseWalletIsActive,
      isActivating: coinbaseWalletIsActivating,
      isEagerlyConnecting: isCoinbaseWalletEagerlyConnecting,
      setIsEagerlyConnecting: setIsCoinbaseWalletEagerlyConnecting,
    }
    const walletConnectState: ConnectorState = {
      isActive: walletConnectIsActive,
      previousIsActive: previousWalletConnectIsActive,
      isActivating: walletConnectIsActivating,
      isEagerlyConnecting: isWalletConnectEagerlyConnecting,
      setIsEagerlyConnecting: setIsWalletConnectEagerlyConnecting,
    }
    const isActiveMap = new Map<Wallet, ConnectorState>([
      [Wallet.INJECTED, injectedState],
      [Wallet.COINBASE_WALLET, coinbaseWalletState],
      [Wallet.WALLET_CONNECT, walletConnectState],
    ])

    isActiveMap.forEach((state: ConnectorState, wallet: Wallet) => {
      const { isActive, previousIsActive, isActivating, isEagerlyConnecting, setIsEagerlyConnecting } = state

      if (!isActive && previousIsActive === undefined && isActivating) {
        // if previousIsActive is undefined and isActivating is true, then we know it's an eager connection attempt
        setIsEagerlyConnecting(true)
      } else if (isActive && !previousIsActive) {
        // if the connection state changes...

        // reset the eagerly connecting state
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
        }

        // when a user manually sets their new connection we want to set a wallet override
        // we also want to set an override when they were a user prior to this state being introduced
        if (!isEagerlyConnecting || !walletOverrideBackfilled) {
          dispatch(updateWalletOverride({ wallet }))
        }
      }
    })
  }, [
    dispatch,
    walletOverrideBackfilled,
    injectedIsActive,
    coinbaseWalletIsActive,
    walletConnectIsActive,
    previousInjectedIsActive,
    previousCoinbaseWalletIsActive,
    previousWalletConnectIsActive,
    injectedIsActivating,
    coinbaseWalletIsActivating,
    walletConnectIsActivating,
    isInjectedEagerlyConnecting,
    isCoinbaseWalletEagerlyConnecting,
    isWalletConnectEagerlyConnecting,
    setIsInjectedEagerlyConnecting,
    setIsCoinbaseWalletEagerlyConnecting,
    setIsWalletConnectEagerlyConnecting,
  ])

  return null
}

interface Props {
  children: JSX.Element
}

const Web3Provider = ({ children }: Props) => {
  const walletOverride = useAppSelector((state) => state.user.walletOverride)
  const connectorOverride = walletOverride ? getConnectorForWallet(walletOverride) : undefined

  useEffect(() => {
    connectorOverride?.connectEagerly()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Web3ReactProvider connectors={connectors}>
      <Web3Updater />
      {children}
    </Web3ReactProvider>
  )
}

export default Web3Provider
