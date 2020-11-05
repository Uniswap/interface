import React from 'react'
import styled from 'styled-components'
import border8pxRadius from '../assets/images/border-8px-radius.png'

export const BodyWrapper = styled.div`
  position: relative;
  max-width: 420px;
  width: 100%;
  background: ${({ theme }) => theme.bg1};
  border: 8px solid transparent;
  border-radius: 8px;
  border-image: url(${border8pxRadius}) 8;
  padding: 12px;
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children }: { children: React.ReactNode }) {
  return <BodyWrapper>{children}</BodyWrapper>
}
