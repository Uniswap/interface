import React from 'react'
import styled from 'styled-components'
import border8pxRadius from '../assets/images/border-8px-radius.png'

export const BodyWrapper = styled.div`
  position: relative;
  max-width: 420px;
  width: 100%;
  background: #181520;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px hsla(0, 0%, 0%, 0.01);
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
