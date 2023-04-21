import styled, { css } from 'styled-components/macro'
import { ThemedText } from 'theme'

export const containerStyles = css`
  background: ${({ theme }) => theme.backgroundSurface};
  border-radius: 16px;
  padding: 16px 20px;
  width: 100%;
  align-self: flex-start;
`

export const TabNumBubble = styled(ThemedText.UtilityBadge)`
  background: ${({ theme }) => theme.backgroundOutline};
  border-radius: 4px;
  padding: 2px 4px;
  color: ${({ theme }) => theme.textSecondary};
  line-height: 12px;
`
