import React from 'react'
import { Box } from 'rebass/styled-components'
import styled from 'styled-components'

const Base = styled(Box)`
  width: 100%;
  padding: 1rem;
  color: white;
  background-color: ${({ theme }) => theme.colors.blue5};
`

const FullBannerStyled = styled(Base)`
  position: absolute;
  top: 0;
  left: 0;
`

export default function Banner({ children, ...rest }) {
  return <Base {...rest}>{children}</Base>
}

export function FullBanner({ children, ...rest }) {
  return <FullBannerStyled {...rest}>{children}</FullBannerStyled>
}
