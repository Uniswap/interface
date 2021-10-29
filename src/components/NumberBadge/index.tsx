import { transparentize } from 'polished'
import styled, { css } from 'styled-components'

export interface NumberBadgeProps {
  badgeTheme?: 'green' | 'orange' | 'red'
}

export const NumberBadge = styled.div<NumberBadgeProps>`
  position: relative;
  width: 16px;
  height: 16px;
  border: 1px solid ${props => props.theme.bg3};
  border-radius: 50%;
  background-color: ${props => transparentize(0.3, props.theme.bg3)};
  font-size: 9px;

  & > span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-weight: 500;
    font-size: 11px;
  }
  
  ${({ badgeTheme: theme }) =>
    theme === 'green' &&
    css`
      background: rgba(14, 159, 110, 0.08);
      border: 1px solid rgba(14, 159, 110, 0.65);
      color: #0e9f6e;
    `}
  
  ${({ badgeTheme }) =>
    badgeTheme === 'orange' &&
    css`
      background: rgba(242, 153, 74, 0.08);
      border: 1px solid rgba(242, 153, 74, 0.65);
      color: #f2994a;
    `}

  ${({ badgeTheme }) =>
    badgeTheme === 'red' &&
    css`
      background: rgba(240, 46, 81, 0.08);
      border: 1px solid rgba(240, 46, 81, 0.65);
      color: #f02e51;
    `}
`
