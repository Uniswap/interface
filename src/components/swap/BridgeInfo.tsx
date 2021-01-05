import React, { useState } from 'react'
import { Link } from 'rebass'

import { AutoColumn } from '../Column'
import { RowCenter } from '../Row'
import { TYPE } from '../../theme'
import fuseLogo from '../../assets/svg/bridge-icon2.svg'
import infoIcon from '../../assets/svg/info.svg'
import styled from 'styled-components'
import ConnectFuseModal from '../ConnectFuseModal'

const FuseLogo = styled.img.attrs({
  src: fuseLogo
})`
  width: 120px;
  margin-top: 1rem;
  margin-bottom: 2rem;
`

const ModalLink = styled(Link)`
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const InfoIcon = styled.img.attrs({
  src: infoIcon
})`
  min-width: 18px;
`

function BridgeInfo() {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      <ConnectFuseModal isOpen={modalOpen} setIsOpen={setModalOpen} />

      <AutoColumn style={{ padding: '0 20px 20px' }}>
        <RowCenter>
          <FuseLogo />
        </RowCenter>
        <RowCenter style={{ alignItems: 'flex-start' }}>
          <InfoIcon />
          <TYPE.body fontSize={18} fontWeight={500} textAlign="center" style={{ marginTop: '-3px' }}>
            To start using FuseSwap please use the bridge to deposit your tokens Or Switch to Fuse{' '}
            <ModalLink onClick={() => setModalOpen(true)}>Click here</ModalLink> to learn how
          </TYPE.body>
        </RowCenter>
      </AutoColumn>
    </>
  )
}

export default BridgeInfo
