import React from 'react'
import styled from 'styled-components'
import { X } from 'react-feather'

import { TYPE } from 'theme'

const Wrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`

const CloseButtonWrapper = styled.div`
  cursor: pointer;
`

function ModalHeader({ title = undefined, onClose }: { title?: string; onClose: () => void }): JSX.Element {
  return (
    <Wrapper>
      {title && <TYPE.mediumHeader>{title}</TYPE.mediumHeader>}

      <CloseButtonWrapper onClick={onClose}>
        <X size={16} />
      </CloseButtonWrapper>
    </Wrapper>
  )
}

export default ModalHeader
