import React from 'react'
import { SwapPoolTabs } from '../NavigationTabs'
import { AutoColumn } from '../Column'
import { RowCenter } from '../Row'
import { TYPE, ExternalLink } from '../../theme'
import AppBody from '../../pages/AppBody'
import { Wrapper } from './styleds'
import icon from '../../assets/svg/fuse.svg'
import styled from 'styled-components'

const Icon = styled.img.attrs({
  src: icon
})`
  width: 80px;
  margin-top: 1rem;
  margin-bottom: 2rem;
`

export default function Maintenance() {
  return (
    <>
      <AppBody>
        <Wrapper>
          <SwapPoolTabs active={'swap'} />
          <AutoColumn style={{ padding: '0 20px 40px' }}>
            <RowCenter>
              <Icon />
            </RowCenter>
            <RowCenter>
              <TYPE.body fontSize={18} fontWeight={500} textAlign="center">
                FuseSwap is in Maintenance mode. <br /> <ExternalLink href="">Click here</ExternalLink> to learn more.
              </TYPE.body>
            </RowCenter>
          </AutoColumn>
        </Wrapper>
      </AppBody>
    </>
  )
}
