import { Provider } from '@ethersproject/abstract-provider'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { getDefaultTheme } from 'lib/theme'
import { ReactNode } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

import Widget from './components/Widget'
import { Connectors } from './cosmos/components'

export const providerAtom = atom<Provider | undefined>(undefined)

export default function WidgetDecorator({ children }: { children: ReactNode }) {
  const [theme] = useValue('theme', { defaultValue: getDefaultTheme() })
  const [locale] = useSelect('locale', { defaultValue: DEFAULT_LOCALE, options: ['pseudo', ...SUPPORTED_LOCALES] })
  const provider = useAtomValue(providerAtom)
  return (
    <>
      <Connectors />
      <Widget theme={theme} locale={locale} provider={provider}>
        {children}
      </Widget>
    </>
  )
}
