import React from 'react'
import { Box, BoxProps } from 'rebass'
import styled from 'styled-components'

export const BodyWrapper = styled(Box)`
  position: relative;
  /* max-width: 420px; */
  max-width: 30rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    max-width: 100%;
  `};
  /* max-width: 38rem; */
  width: 30rem;
  padding: 1.8rem;
  /* box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01); */
  /* border-radius: 30px; */
  /* padding: 1rem; */
  border-radius: 2.5rem;
  background: rgba(31, 31, 31, 0.55);
  background: linear-gradient(180deg, #2b4854 0%, #293f53 100%);
  backdrop-filter: blur(36.9183px);
  // box-shadow: 0px -2px 0px #39e1ba;
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, ...props }: { children: React.ReactNode } & BoxProps) {
  return <BodyWrapper {...props}>{children}</BodyWrapper>
}
