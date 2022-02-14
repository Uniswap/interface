import { PropsWithChildren } from 'react'

import Row from './components/Row'
import Widget from './cosmos/components/Widget'

export default function WidgetDecorator({ children }: PropsWithChildren<Record<string, never>>) {
  return (
    <Row justify="center">
      <Widget>{children}</Widget>
    </Row>
  )
}
