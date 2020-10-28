import React from 'react'

import { AutoColumn } from '../Column'
import { RowCenter } from '../Row'
import { TYPE } from '../../theme'
import fuseLogo from '../../assets/svg/bridge-icon2.svg'
import infoIcon from '../../assets/svg/info.svg'
import styled from 'styled-components'

const FuseLogo = styled.img.attrs({
  src: fuseLogo
})`
  width: 120px;
  margin-top: 1rem;
  margin-bottom: 2rem;
`

const InfoIcon = styled.img.attrs({
  src: infoIcon
})`
  min-width: 18px;
`

function BridgeInfo() {
  return (
    <>
      <AutoColumn style={{ padding: '0 20px 40px' }}>
        <RowCenter>
          <FuseLogo />
        </RowCenter>
        <RowCenter style={{ alignItems: 'flex-start' }}>
          <InfoIcon />
          <TYPE.body fontSize={18} fontWeight={500} textAlign="center" style={{ marginTop: '-3px' }}>
            To start using FuseSwap please use the bridge to deposit your tokens
          </TYPE.body>
        </RowCenter>
      </AutoColumn>
    </>
  )
}

export default BridgeInfo
