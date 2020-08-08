import React from 'react'
import styled from 'styled-components'
import UnicornSvg from '../components/UnicornSvg'

export const HeadersPlusBodyWrapper = styled.div<{ disabled?: boolean }>`
  position: relative;
  max-width: 420px;
  width: 100%;
  text-align: center;
  
`
export const BodyWrapper = styled.div<{ disabled?: boolean }>`
  position: relative;
  max-width: 420px;
  width: 100%;
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 30px;
  padding: 1rem;
  opacity: ${({ disabled }) => (disabled ? '0.4' : '1')};
  pointer-events: ${({ disabled }) => disabled && 'none'};
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return <HeadersPlusBodyWrapper>
    <UnicornSvg mobile={true} />
    <h1 className="mainHeader">Mooniswap</h1>
    <h4 className="mainHeader">Next generation AMM protocol from 1inch team</h4>
    <UnicornSvg />
    <UnicornSvg flip={true} />
    <BodyWrapper disabled={disabled}>{children}</BodyWrapper>
  </HeadersPlusBodyWrapper>
}
