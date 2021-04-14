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
  color: ${({ color }) => color || 'white'};
`

const ExpandableSectionButton = ({ onClick, expanded }: ExpandableSectionButtonProps) => {
  return (
    <ButtonEmpty padding="0" width="100%" onClick={() => typeof onClick === 'function' && onClick()}>
      {expanded ? (
        <StyledIcon>
          <ChevronUp />
        </StyledIcon>
      ) : (
        <StyledIcon>
          <ChevronDown />
        </StyledIcon>
      )}
    </ButtonEmpty>
  )
}

export default ExpandableSectionButton
