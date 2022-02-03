import { transparentize } from 'polished'
import styled, { css } from 'styled-components'

export interface NumberBadgeProps {
  badgeTheme?: 'green' | 'orange' | 'red'
}

export const NumberBadge = styled.div<NumberBadgeProps>`
 
  display:flex;
  padding:0 2px;
  height:16px;
  width: auto;
  border: 1.75px solid ${props => props.theme.bg3};
  border-radius: 4px;
  background-color: ${props => transparentize(0.3, props.theme.bg3)};

  & > span {
  
    font-weight: 500;
    font-size: 9px;
  }
  
  ${({ badgeTheme: theme }) =>
    theme === 'green' &&
    css`
      background: rgba(14, 159, 110, 0.08);
      border: 1.75px solid rgba(14, 159, 110, 0.65);
      color: #0e9f6e;
    `}
  
  ${({ badgeTheme }) =>
    badgeTheme === 'orange' &&
    css`
      background: rgba(242, 153, 74, 0.08);
      border: 1.75px solid rgba(242, 153, 74, 0.65);
      color: #f2994a;
    `}

  ${({ badgeTheme }) =>
    badgeTheme === 'red' &&
    css`
      background: rgba(240, 46, 81, 0.08);
      border: 1.75px solid rgba(240, 46, 81, 0.65);
      color: #f02e51;
    `}
`
