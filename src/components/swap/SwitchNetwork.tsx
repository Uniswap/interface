import React, { useState } from 'react'
import { RowCenter } from '../Row'
import { AutoColumn } from '../Column'
import { TYPE } from '../../theme'
import icon from '../../assets/svg/fuse.svg'
import styled from 'styled-components'
import ConnectFuseModal from '../ConnectFuseModal'
import { Link as RebassLink } from 'rebass'
import useAddChain from '../../hooks/useAddChain'
import { FUSE_CHAIN } from '../../constants/chains'

const Link = styled(RebassLink)`
  font-weight: 600;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const Icon = styled.img.attrs({
  src: icon
})`
  width: 80px;
  margin-top: 1rem;
  margin-bottom: 2rem;
`

function SwitchNetwork() {
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const { error, addChain } = useAddChain()

  return (
    <>
      <ConnectFuseModal isOpen={modalOpen} setIsOpen={setModalOpen} />

      <AutoColumn style={{ padding: '0 20px 40px' }}>
        <RowCenter>
          <Icon />
        </RowCenter>
        <RowCenter>
          <TYPE.body fontSize={18} fontWeight={500}>
            <Link id="fuse-connect-open" onClick={() => addChain(FUSE_CHAIN)}>
              Switch to Fuse Network
            </Link>
          </TYPE.body>
        </RowCenter>
        {error && (
          <RowCenter>
            <TYPE.error error={true} marginTop={16}>
              {error}
            </TYPE.error>
          </RowCenter>
        )}
      </AutoColumn>
    </>
  )
}

export default SwitchNetwork
