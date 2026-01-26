/* eslint-disable import/no-unused-modules */
import {
  useActiveAddress,
  useActiveAddresses,
  useActiveConnector,
  useActiveWallet,
  useConnectionStatus,
} from 'features/accounts/store/hooks'
import type { ExternalConnector, ExternalWallet } from 'features/accounts/store/types'
import { PropsWithChildren, useEffect, useState } from 'react'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

// Typing 'logAccountsStore' into the console will enable AccountsStore logging
const DEVTOOL_TRIGGER = 'logAccountsStore'

export function AccountsStoreDevTool(): JSX.Element | null {
  return (
    <DevToolGate toolTrigger={DEVTOOL_TRIGGER}>
      <UniswapAccountsStoreDevToolLogger />
    </DevToolGate>
  )
}

function DevToolGate({ children, toolTrigger }: PropsWithChildren<{ toolTrigger: string }>): JSX.Element | null {
  const [log, setLog] = useState(false)

  useEffect(() => {
    Object.defineProperty(window, toolTrigger, {
      get() {
        setLog((c) => !c)
        return `toggling ${toolTrigger}...`
      },
      configurable: true,
    })

    return () => {
      delete (window as any)[toolTrigger]
    }
  }, [toolTrigger])

  // Avoid mounting the ConsoleDevTool unless the gate is open
  return log ? <>{children}</> : null
}

function UniswapAccountsStoreDevToolLogger() {
  const wallet = useActiveWallet(Platform.EVM)
  const evmConnector = useActiveConnector(Platform.EVM)
  const svmConnector = useActiveConnector(Platform.SVM)

  const addresses = useActiveAddresses()
  const evmAddress = useActiveAddress(Platform.EVM)
  const status = useConnectionStatus('aggregate')
  const svmAddress = useActiveAddress(Platform.SVM)

  useEffect(() => {
    let numFontWeights = 7
    if (wallet) {
      numFontWeights += 6
    }

    if (evmConnector) {
      numFontWeights += 4
    }

    if (svmConnector) {
      numFontWeights += 4
    }

    // Devtools logging removed
  }, [wallet, evmConnector, svmConnector, addresses, evmAddress, status, svmAddress])
  return null
}

function getWalletString(wallet?: ExternalWallet) {
  if (!wallet) {
    return 'undefined'
  }

  return `
        %cid%c: ${wallet.id}
        %cname%c: ${wallet.name}
        %cicon%c: <omitted>
        %caddresses[0]%c: ${JSON.stringify(wallet.addresses)}
        %cconnectorIds%c: ${JSON.stringify(wallet.connectorIds)}
        %csigningCapability%c: ${wallet.signingCapability}
  `
}

function getConnectorString(connector?: ExternalConnector<Platform.EVM> | ExternalConnector<Platform.SVM>) {
  if (!connector) {
    return 'undefined'
  }

  return `
        %cid%c: ${connector.id}
        %cstatus%c: ${connector.status}
        %csession%c: ${connector.session ? 'exists' : 'undefined'}
        %caccess%c: ${connector.access}
  `
}
