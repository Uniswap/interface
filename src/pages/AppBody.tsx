import React from 'react'
import styled from 'styled-components'
import border8pxRadius from '../assets/images/border-8px-radius.png'

export const BodyWrapper = styled.div<{ tradeDetailsOpen?: boolean }>`
  position: relative;
  max-width: 420px;
  width: 100%;
  background: ${({ theme }) => theme.bg1};
  border: 8px solid transparent;
  border-radius: 8px;
  border-image: url(${border8pxRadius}) 8;
  padding: 12px;
  transition: box-shadow 0.3s ease;
  box-shadow: ${({ tradeDetailsOpen }) =>
    tradeDetailsOpen ? '0px 40px 42px -24px rgba(0, 0, 0, 0.22);' : '0px 40px 36px -24px rgba(0, 0, 0, 0.32)'};
`

interface AppBodyProps {
  tradeDetailsOpen?: boolean
  children: React.ReactNode
}

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, tradeDetailsOpen }: AppBodyProps) {
  return <BodyWrapper tradeDetailsOpen={tradeDetailsOpen}>{children}</BodyWrapper>
}
