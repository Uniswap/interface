import React from 'react'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme'

export const BodyWrapper = styled.main<{ margin?: string; maxWidth?: string }>`
  margin-top: ${({ margin }) => margin ?? '0px'};
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0 0 12px 6px ${({ theme }) => theme.shadow2};
  border-radius: 20px;
  height: 100%;
  width: 100%;

  z-index: ${Z_INDEX.deprecated_content};

  @media screen and (max-width: 1592px) {
    flex-direction: row;
    gap: 0rem;
    margin-top: 0rem;
  }
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, ...rest }: { children: React.ReactNode }) {
  return <BodyWrapper {...rest}>{children}</BodyWrapper>
}
