import React from 'react'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme'

export const BodyWrapper = styled.main<{ margin?: string; maxWidth?: string }>`
  position: end;
  margin-top: ${({ margin }) => margin ?? '0px'};
  max-height: 100%;
  width: 100%;
  max-width: 531px;
  background: ${({ theme }) => theme.bg0};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 24px;
  z-index: ${Z_INDEX.deprecated_content};
  flex-grow: 0;
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

  @media screen and (max-width: 900px) {
    max-width: 100%;
  }
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, ...rest }: { children: React.ReactNode }) {
  return <BodyWrapper {...rest}>{children}</BodyWrapper>
}
