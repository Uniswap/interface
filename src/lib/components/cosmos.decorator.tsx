import { getDefaultTheme } from 'lib/theme'
import { ReactNode } from 'react'
import { useValue } from 'react-cosmos/fixture'

import Widget from './Widget'

export default function WidgetDecorator({ children }: { children: ReactNode }) {
  const [theme] = useValue('theme', { defaultValue: getDefaultTheme() })
  const [locale] = useValue('locale', { defaultValue: 'pseudo' })
  return (
    <Widget theme={theme} locale={locale}>
      {children}
    </Widget>
  )
}
