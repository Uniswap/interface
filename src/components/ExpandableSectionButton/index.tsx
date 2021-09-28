import React from 'react'
import { ChevronUp, ChevronDown } from 'react-feather'

import { ButtonEmpty } from 'components/Button'
import styled from 'styled-components'

export interface ExpandableSectionButtonProps {
  onClick?: () => void
  expanded?: boolean
  color?: string
}

const StyledIcon = styled.div<{ color?: string }>`
  color: ${({ theme, color }) => color || theme.text};
`

const ExpandableSectionButton = ({ onClick, expanded }: ExpandableSectionButtonProps) => {
  return (
    <ButtonEmpty padding="0" width="100%" onClick={() => typeof onClick === 'function' && onClick()}>
      {expanded ? (
        <StyledIcon>
          <ChevronUp size={16} />
        </StyledIcon>
      ) : (
        <StyledIcon>
          <ChevronDown size={16} />
        </StyledIcon>
      )}
    </ButtonEmpty>
  )
}

export default ExpandableSectionButton
