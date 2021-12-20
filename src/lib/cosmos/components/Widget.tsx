import { SupportedChainId } from 'constants/chains'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import { useAtomValue } from 'jotai/utils'
import Widget from 'lib/components/Widget'
import { darkTheme, defaultTheme, lightTheme } from 'lib/theme'
import { ReactNode, useEffect } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

import { URLS } from '../connectors/network'
import { cosmosProviderAtom } from '../state/provider'

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
  const [jsonRpcEndpoint] = useSelect('jsonRpcEndpoint', {
    defaultValue: URLS[SupportedChainId.MAINNET][0],
    options: Object.values(URLS).flat(),
  })
  const provider = useAtomValue(cosmosProviderAtom)

  return (
    <Widget width={width} theme={theme} locale={locale} jsonRpcEndpoint={jsonRpcEndpoint} provider={provider}>
      {children}
    </Widget>
  )
}
