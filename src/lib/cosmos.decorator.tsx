import { JSXElementConstructor, ReactElement } from 'react'
import { createGlobalStyle } from 'styled-components'

import Row from './components/Row'
import Connectors from './cosmos/components/Connectors'
import Widget from './cosmos/components/Widget'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`

export default function WidgetDecorator({
  children,
}: {
  children: ReactElement<any, string | JSXElementConstructor<any>>
}) {
  return (
    <>
      <GlobalStyle />
      <Connectors />
      <Row justify="center">
        <Widget>{children}</Widget>
      </Row>
    </>
  )
}
