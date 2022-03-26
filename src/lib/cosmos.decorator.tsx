import { JSXElementConstructor, ReactElement } from 'react'

import Row from './components/Row'
import Widget from './cosmos/components/Widget'

export default function WidgetDecorator({
  children,
}: {
  children: ReactElement<any, string | JSXElementConstructor<any>>
}) {
  return (
    <Row justify="center">
      <Widget>{children}</Widget>
    </Row>
  )
}
