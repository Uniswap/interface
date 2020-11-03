import React from 'react'
import { RowCenter } from '../Row'
import { AutoColumn } from '../Column'
import { TYPE, ExternalLink } from '../../theme'
import icon from '../../assets/svg/fuse.svg'
import styled from 'styled-components'

const Icon = styled.img.attrs({
  src: icon
})`
  width: 80px;
  margin-top: 1rem;
  margin-bottom: 2rem;
`

function SwitchNetwork() {
  return (
    <>
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
          <ExternalLink
            href="https://docs.fuse.io/the-fuse-studio/getting-started/how-to-add-fuse-to-your-metamask"
            style={{ fontSize: 18, color: 'white' }}
          >
            Click here to learn how
          </ExternalLink>
        </RowCenter>
      </AutoColumn>
    </>
  )
}

export default SwitchNetwork
