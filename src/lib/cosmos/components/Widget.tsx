import { SupportedChainId } from 'constants/chains'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import Widget from 'lib/components/Widget'
import { darkTheme, defaultTheme, lightTheme } from 'lib/theme'
import { ReactNode, useEffect, useMemo } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

import { metaMask } from '../connectors/metaMask'
import { URLS } from '../connectors/network'

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
    defaultValue: URLS[SupportedChainId.MAINNET][0] || NO_JSON_RPC,
    options: [NO_JSON_RPC, ...Object.values(URLS).flat()],
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
