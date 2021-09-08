import React from 'react'
import styled from 'styled-components'

import { TYPE } from 'theme'

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`

function ModalHeader({ title = undefined }: { title?: string }): JSX.Element {
  return <Wrapper>{title && <TYPE.mediumHeader>{title}</TYPE.mediumHeader>}</Wrapper>
}

export default ModalHeader
