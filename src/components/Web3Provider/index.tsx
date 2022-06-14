import { Web3ReactProvider } from '@web3-react/core'
import { Connector } from '@web3-react/types'
import { getConnectorForWallet, gnosisSafe, MODAL_WALLETS, network, useConnectors, Wallet } from 'connectors'
import useIsActiveMap from 'hooks/useIsActiveMap'
import usePrevious from 'hooks/usePrevious'
import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { updateWalletOverride } from 'state/walletOverride/reducer'

const connect = async (connector: Connector) => {
  try {
    if (connector.connectEagerly) {
      await connector.connectEagerly()
    } else {
      await connector.activate()
    }
  } catch (error) {
    console.debug(`web3-react error: ${typeof connector}, ${error}`)
  }
}

// This component handles state changes in web3-react. It eagerly connects to all wallets.
// It also checks for Coinbase Wallet, Wallet Connect Fortmatic or Injected wallets to become active.
function Web3Updater() {
  const dispatch = useAppDispatch()

  const walletOverride = useAppSelector((state) => state.walletOverride.walletOverride)
  const walletOverrideBackfilled = useAppSelector((state) => state.walletOverride.walletOverrideBackfilled)

  const [isEagerlyConnecting, setIsEagerlyConnecting] = useState(false)
  const isActiveMap = useIsActiveMap()
  const previousIsActiveMap = usePrevious(isActiveMap)

  useEffect(() => {
    isActiveMap.forEach((isActive: boolean, wallet: Wallet) => {
      if (isActive && !previousIsActiveMap?.get(wallet)) {
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
        } else if (!walletOverrideBackfilled) {
          // When a user manually sets their new connection, set a wallet override.
          // Also set an override when they were a user prior to this state being introduced.
          dispatch(updateWalletOverride({ wallet }))
        }
      }
    })
  }, [
    dispatch,
    isActiveMap,
    previousIsActiveMap,
    isEagerlyConnecting,
    setIsEagerlyConnecting,
    walletOverride,
    walletOverrideBackfilled,
  ])

  // The dependency list is empty so this is only run once on mount
  useEffect(() => {
    connect(gnosisSafe)
    connect(network)

    if (walletOverride) {
      connect(getConnectorForWallet(walletOverride))
      setIsEagerlyConnecting(true)
    } else if (!walletOverrideBackfilled) {
      MODAL_WALLETS.filter((wallet) => wallet !== Wallet.FORTMATIC) // Don't try to connect to Fortmatic because it opens up a modal
        .map(getConnectorForWallet)
        .forEach(connect)
      setIsEagerlyConnecting(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    isActiveMap.forEach((isActive: boolean, wallet: Wallet) => {
      const previousIsActive = previousIsActiveMap?.get(wallet)
      if (isActive && !previousIsActive) {
        // When a user manually sets their new connection, set a wallet override.
        // Also set an override when they were a user prior to this state being introduced.
        if (!isEagerlyConnecting || !walletOverrideBackfilled) {
          dispatch(updateWalletOverride({ wallet }))
        }

        // Reset the eagerly connecting state.
        if (isEagerlyConnecting) {
          setIsEagerlyConnecting(false)
        }
      }
    })
  }, [
    dispatch,
    walletOverride,
    walletOverrideBackfilled,
    isActiveMap,
    previousIsActiveMap,
    isEagerlyConnecting,
    setIsEagerlyConnecting,
  ])

  return null
}

interface Props {
  children: JSX.Element
}

export default function Web3Provider({ children }: Props) {
  const walletOverride = useAppSelector((state) => state.walletOverride.walletOverride)
  const connectors = useConnectors(walletOverride)
  return (
    <Web3ReactProvider connectors={connectors}>
      <Web3Updater />
      {children}
    </Web3ReactProvider>
  )
}
