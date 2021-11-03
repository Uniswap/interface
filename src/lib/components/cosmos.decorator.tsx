import { getDefaultTheme } from 'lib/theme'
import { ReactNode } from 'react'
import { useValue } from 'react-cosmos/fixture'

import Widget from './Widget'

export default function WidgetDecorator({ children }: { children: ReactNode }) {
  const [theme] = useValue('theme', { defaultValue: getDefaultTheme() })
  return <Widget theme={theme}>{children}</Widget>
}
