import { Phase0Variant, usePhase0Flag } from 'featureFlags/flags/phase0'
import React from 'react'
import styled from 'styled-components/macro'
import { Z_INDEX } from 'theme'

export const BodyWrapper = styled.main<{ margin?: string; maxWidth?: string; phase0Flag?: boolean }>`
  position: relative;
  margin-top: ${({ margin }) => margin ?? '0px'};
  max-width: ${({ maxWidth, phase0Flag }) => maxWidth ?? (phase0Flag ? '420px' : '480px')};
  width: 100%;
  background: ${({ theme, phase0Flag }) => (phase0Flag ? theme.backgroundSurface : theme.deprecated_bg0)};
  border-radius: ${({ phase0Flag }) => (phase0Flag ? '16px' : '24px')};
  border: 1px solid ${({ theme, phase0Flag }) => (phase0Flag ? theme.backgroundOutline : theme.none)};
  margin-top: 1rem;
  margin-left: auto;
  margin-right: auto;
  z-index: ${Z_INDEX.deprecated_content};
  font-feature-settings: ${({ phase0Flag }) => phase0Flag && "'ss02' off"};
  box-shadow: ${({ phase0Flag }) =>
    !phase0Flag &&
    '0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 24px 32px rgba(0, 0, 0, 0.01)'};
`

/**
 * The styled container element that wraps the content of most pages and the tabs.
 */
export default function AppBody({ children, ...rest }: { children: React.ReactNode }) {
  const phase0Flag = usePhase0Flag()
  const phase0FlagEnabled = phase0Flag === Phase0Variant.Enabled
  return (
    <BodyWrapper {...rest} phase0Flag={phase0FlagEnabled}>
      {children}
    </BodyWrapper>
  )
}
