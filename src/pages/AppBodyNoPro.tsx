import React from 'react'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme'

export const BodyWrapper = styled.main<{ margin?: string; maxWidth?: string }>`
  margin-top: ${({ margin }) => margin ?? '0px'};
  max-height: 100%;
  height: auto;
  width: 100%;
  max-width: 480px;
  background: ${({ theme }) => theme.bg1};
  border-radius: 20px;
  z-index: ${Z_INDEX.deprecated_content};
  flex-grow: 1;
  overflow-x: hidden;
  overflow-y: hidden;
  flex: 1;

  @media screen and (max-width: 1592px) {
    flex-direction: row;
    gap: 0rem;
    height: 100%;
    margin-top: 0rem;
  }

  @media screen and (max-width: 1000px) {
    width: 100%;
  }

  @media screen and (max-width: 1000px) {
    max-width: 100%;
  }
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBodyNoPro({ children, ...rest }: { children: React.ReactNode }) {
  return <BodyWrapper {...rest}>{children}</BodyWrapper>
}
