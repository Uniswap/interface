import React from 'react'
import styled from 'styled-components'
import NavigationTabs from '../components/NavigationTabs'

export const Body = styled.div`
  max-width: 420px;
  width: 100%;
  /* min-height: 340px; */
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 30px;
  box-sizing: border-box;
  padding: 1rem;
  position: relative;
  margin-bottom: 10rem;
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children }: { children: React.ReactNode }) {
  return (
    <Body>
      <NavigationTabs />
      <>{children}</>
    </Body>
  )
}
