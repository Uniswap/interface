import { initializeConnector } from '@widgets/web3-react/core'
import { MetaMask } from '@widgets/web3-react/metamask'
import { SupportedChainId } from 'constants/chains'
import { INFURA_NETWORK_URLS } from 'constants/infura'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import Widget from 'lib/components/Widget'
import { darkTheme, defaultTheme, lightTheme } from 'lib/theme'
import { ReactNode, useEffect, useMemo } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

export const [metaMask] = initializeConnector<MetaMask>((actions) => new MetaMask(actions))

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

  const NO_PROVIDER = 'None'
  const META_MASK = 'MetaMask'
  const [providerType] = useSelect('Provider', {
    defaultValue: NO_PROVIDER,
    options: [NO_PROVIDER, META_MASK],
  })
  const provider = useMemo(() => {
    switch (providerType) {
      case META_MASK:
        metaMask.activate()
        return metaMask.provider
      default:
        return undefined
    }
  }, [providerType])

  return (
    <Widget
      width={width}
      theme={theme}
      locale={locale}
      jsonRpcEndpoint={jsonRpcEndpoint === NO_JSON_RPC ? undefined : jsonRpcEndpoint}
      provider={provider}
    >
      {children}
    </Widget>
  )
}
