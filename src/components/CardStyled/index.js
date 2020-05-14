import React from 'react'
import styled from 'styled-components'

import { Box } from 'rebass/styled-components'

const Base = styled(Box)`
  padding: 1rem;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.bg2};
  border: 1px solid;
  border-color: ${({ theme }) => theme.colors.bg1};
`

const Outlined = styled(Base)`
  border-color: ${({ theme }) => theme.colors.primary2};
`

const Pink = styled(Base)`
  background-color: ${({ theme }) => theme.colors.pink2};
  color: ${({ theme }) => theme.colors.pink1};
`

const PinkOutlined = styled(Pink)`
  border-color: ${({ theme }) => theme.colors.pink1};
`

// export variants
export default function Card({ children, ...rest }) {
  return <Base {...rest}>{children}</Base>
}

export function CardOutlined({ children, ...rest }) {
  return <Outlined {...rest}>{children}</Outlined>
}

export function CardPink({ children, ...rest }) {
  return <Pink {...rest}>{children}</Pink>
}

export function CardPinkOutlined({ children, ...rest }) {
  return <PinkOutlined {...rest}>{children}</PinkOutlined>
}
