import React from 'react'
import styled from 'styled-components'
import { darken } from 'polished'

export const CardStyled = styled.button.attrs(({}) => ({}))`
  height: 100%
  width: 100%;
  border-radius: 20px;
`

function Card({ children }) {
  return <CardStyled>{children}</CardStyled>
}

export default Card
