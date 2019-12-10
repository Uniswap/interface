import React from 'react'
import styled from 'styled-components'
import { lighten } from 'polished'

export const BadgeStyled = styled.div`
  padding: 4px 12px;
  border-radius: 12px;
  width: fit-content;
  background-color: ${({ color, theme }) => lighten(0.4, color ? color : theme.cardBackground)};
  color: ${({ color }) => color};
`

function Badge({ children, color }) {
  return <BadgeStyled color={color}>{children}</BadgeStyled>
}

export default Badge
