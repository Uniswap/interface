import styled from 'lib/theme'
import { JSXElementConstructor, ReactElement } from 'react'
import { createGlobalStyle } from 'styled-components'

import Connectors from './cosmos/components/Connectors'
import { useCosmosTheme } from './cosmos/state/theme'
import { useCosmosWidth } from './cosmos/state/width'

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
  }
`

const Wrapper = styled.div`
  display: flex;
  justify-content: center;
`

export default function WidgetDecorator({
  children,
}: {
  children: ReactElement<any, string | JSXElementConstructor<any>>
}) {
  useCosmosWidth()
  useCosmosTheme()

  return (
    <>
      <GlobalStyle />
      <Connectors />
      <Wrapper>{children}</Wrapper>
    </>
  )
}
