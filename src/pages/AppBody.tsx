import styled from 'styled-components/macro'
import { glowEffect } from 'theme/styles/glow'
import { Z_INDEX } from 'theme/zIndex'

export const BodyWrapper = styled.main<{ chainId?: number; margin?: string; maxWidth?: string }>`
  ${glowEffect}

  position: relative;
  margin-top: ${({ margin }) => margin ?? '0px'};
  max-width: ${({ maxWidth }) => maxWidth ?? '420px'};
  width: 100%;
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 16px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-top: 1rem;
  margin-left: auto;
  margin-right: auto;
  z-index: ${Z_INDEX.deprecated_content};
  font-feature-settings: 'ss01' on, 'ss02' on, 'cv01' on, 'cv03' on;
`
