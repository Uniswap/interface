import { initializeConnector } from '@web3-react/core'
import { MetaMask } from '@web3-react/metamask'
import { Connector } from '@web3-react/types'
import { WalletConnect } from '@web3-react/walletconnect'
import { SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import Widget from 'lib/components/Widget'
import { darkTheme, defaultTheme, lightTheme } from 'lib/theme'
import { ReactNode, useEffect, useState } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

const [metaMask] = initializeConnector<MetaMask>((actions) => new MetaMask(actions))
const [walletConnect] = initializeConnector<WalletConnect>(
  (actions) => new WalletConnect(actions, { rpc: INFURA_NETWORK_URLS })
)

export default function Wrapper({ children }: { children: ReactNode }) {
  const [width] = useValue('width', { defaultValue: 360 })
  const [locale] = useSelect('locale', { defaultValue: DEFAULT_LOCALE, options: ['pseudo', ...SUPPORTED_LOCALES] })
  const [darkMode] = useValue('dark mode', { defaultValue: false })
  const [theme, setTheme] = useValue('theme', { defaultValue: { ...defaultTheme, ...lightTheme } })
  useEffect(() => {
    setTheme({ ...defaultTheme, ...(darkMode ? darkTheme : lightTheme) })
    // cosmos does not maintain referential equality for setters
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [darkMode])

  const NO_JSON_RPC = 'None'
  const [jsonRpcEndpoint] = useSelect('JSON-RPC', {
    defaultValue: INFURA_NETWORK_URLS[SupportedChainId.MAINNET],
    options: [NO_JSON_RPC, ...Object.values(INFURA_NETWORK_URLS).sort()],
  })

  const NO_CONNECTOR = 'None'
  const META_MASK = 'MetaMask'
  const WALLET_CONNECT = 'WalletConnect'
  const [connectorType] = useSelect('Provider', {
    defaultValue: NO_CONNECTOR,
    options: [NO_CONNECTOR, META_MASK, WALLET_CONNECT],
  })
  const [connector, setConnector] = useState<Connector>()
  useEffect(() => {
    let stale = false
    activateConnector(connectorType)
    return () => {
      stale = true
    }

    async function activateConnector(connectorType: 'None' | 'MetaMask' | 'WalletConnect') {
      let connector: Connector
      switch (connectorType) {
        case META_MASK:
          await metaMask.activate()
          connector = metaMask
          break
        case WALLET_CONNECT:
          await walletConnect.activate()
          connector = walletConnect
      }
      if (!stale) {
        setConnector((oldConnector) => {
          oldConnector?.deactivate?.()
          return connector
        })
      }
    }
  }, [connectorType])

  return (
    <Widget
      width={width}
      theme={theme}
      locale={locale}
      jsonRpcEndpoint={jsonRpcEndpoint === NO_JSON_RPC ? undefined : jsonRpcEndpoint}
      provider={connector?.provider}
    >
      {children}
    </Widget>
  )
}
