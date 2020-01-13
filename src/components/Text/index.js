import React from 'react'
import styled from 'styled-components'

import { Text } from 'rebass/styled-components'

const TextBlockStyling = styled(Text)`
  display: inline-block;
  overflow-wrap: break-word;
  word-break: break-word;
`

export default function TextBlock({ children, ...rest }) {
  return <TextBlockStyling {...rest}>{children}</TextBlockStyling>
}
