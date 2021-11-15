import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from 'constants/locales'
import { getDefaultTheme } from 'lib/theme'
import { ReactNode } from 'react'
import { useSelect, useValue } from 'react-cosmos/fixture'

import Widget from './components/Widget'
import { Connectors } from './cosmos/components'

export default function WidgetDecorator({ children }: { children: ReactNode }) {
  const [theme] = useValue('theme', { defaultValue: getDefaultTheme() })
  const [locale] = useSelect('locale', { defaultValue: DEFAULT_LOCALE, options: ['pseudo', ...SUPPORTED_LOCALES] })
  return (
    <>
      <Connectors />
      <Widget theme={theme} locale={locale}>
        {children}
      </Widget>
    </>
  )
}
