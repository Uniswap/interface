import React from 'react'
import { ChevronDown, ChevronUp } from 'react-feather'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'

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
          <ChevronUp size={16} style={{ marginTop: '5px' }} />
        </StyledIcon>
      ) : (
        <StyledIcon>
          <ChevronDown size={16} style={{ marginTop: '5px' }} />
        </StyledIcon>
      )}
    </ButtonEmpty>
  )
}

export default ExpandableSectionButton
