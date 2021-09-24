import React from 'react'
import styled from 'styled-components'

import { TYPE } from 'theme'

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`

function ModalHeader({ title = undefined }: { title?: string }): JSX.Element {
  return <Wrapper>{title && <TYPE.body>{title}</TYPE.body>}</Wrapper>
}

export default ModalHeader
