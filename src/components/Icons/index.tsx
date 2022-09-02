import { ChevronDown, ChevronUp } from 'react-feather'
import styled from 'styled-components/macro'

export const StyledChevronDown = styled(ChevronDown)<{ customColor?: string }>`
  color: ${({ theme, customColor }) => customColor ?? theme.textSecondary};
  height: 20px;
  width: 20px;

  &:hover {
    color: ${({ theme }) => theme.accentActionSoft};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast}ms color ${timing.in}`};
  }
`

export const StyledChevronUp = styled(ChevronUp)<{ customColor?: string }>`
  color: ${({ theme, customColor }) => customColor ?? theme.textSecondary};
  height: 20px;
  width: 20px;

  &:hover {
    color: ${({ theme }) => theme.accentActionSoft};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast}ms color ${timing.in}`};
  }
`
