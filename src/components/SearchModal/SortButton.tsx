import React from 'react'
import styled from 'styled-components';
import { TYPE } from '../../theme'

const StyledPurple3Text = styled(TYPE.purple3)`
  cursor: pointer;
`;

export default function SortButton({
  toggleSortOrder,
  ascending
}: {
  toggleSortOrder: () => void
  ascending: boolean
}) {
  return (
    <StyledPurple3Text fontSize={14} fontWeight={500} onClick={toggleSortOrder}>
      {ascending ? '↑' : '↓'}
    </StyledPurple3Text>
  )
}
