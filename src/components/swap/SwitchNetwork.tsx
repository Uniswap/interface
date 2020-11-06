import React, { useState } from 'react'
import { RowCenter } from '../Row'
import { AutoColumn } from '../Column'
import { TYPE } from '../../theme'
import icon from '../../assets/svg/fuse.svg'
import styled from 'styled-components'
import ConnectFuseModal from '../ConnectFuseModal'
import { Link } from 'rebass'

const Icon = styled.img.attrs({
  src: icon
})`
  width: 80px;
  margin-top: 1rem;
  margin-bottom: 2rem;
`

function SwitchNetwork() {
  const [modalOpen, setModalOpen] = useState<boolean>(false)

  return (
    <>
      <ConnectFuseModal isOpen={modalOpen} setIsOpen={setModalOpen} />

      <AutoColumn style={{ padding: '0 20px 40px' }}>
        <RowCenter>
          <Icon />
        </RowCenter>
        <RowCenter>
          <TYPE.body fontSize={18} fontWeight={500}>
            Please switch to Fuse
          </TYPE.body>
        </RowCenter>
        <RowCenter>
          <Link
            onClick={() => setModalOpen(true)}
            fontSize={18}
            color="white"
            style={{ fontWeight: 500, cursor: 'pointer' }}
          >
            Click here to learn how
          </Link>
        </RowCenter>
      </AutoColumn>
    </>
  )
}

export default SwitchNetwork
