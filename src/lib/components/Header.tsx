import { largeIconCss } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { ReactElement } from 'react'

import Row from './Row'

const HeaderRow = styled(Row)`
  height: 1.75em;
  margin: 0 0.75em 0.75em;
  padding-top: 0.5em;
  ${largeIconCss}
`

export default function Header({ title, children }: PropsWithChildren<{ title?: ReactElement }>) {
  return (
    <HeaderRow iconSize={1.2}>
      <Row gap={0.5}>{title && <ThemedText.Subhead1>{title}</ThemedText.Subhead1>}</Row>
      <Row gap={1}>{children}</Row>
    </HeaderRow>
  )
}
