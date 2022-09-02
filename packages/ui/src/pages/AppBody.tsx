import React from 'react'
import { Box, BoxProps } from 'rebass'
import styled from 'styled-components'

export const BodyWrapper = styled(Box)`
  position: relative;
  /* max-width: 420px; */
  max-width: 21rem;
  /* max-width: 38rem; */
  width: 100%;
  background: ${({ theme }) => theme.bgSwap};
  /* box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01); */
  /* border-radius: 30px; */
  /* padding: 1rem; */
  backdrop-filter: blur(2rem);
  border-radius: 1.6rem;
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, ...props }: { children: React.ReactNode } & BoxProps) {
  return <BodyWrapper {...props}>{children}</BodyWrapper>
}
