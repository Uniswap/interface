import React from 'react'
import styled from 'styled-components'
import { TYPE } from '../../theme'

const CursorText = styled(TYPE.body)`
  cursor: pointer;
`

export default function SortButton({
  toggleSortOrder,
  ascending
}: {
  toggleSortOrder: () => void
  ascending: boolean
}) {
  return (
    <CursorText fontSize={14} fontWeight={500} onClick={toggleSortOrder}>
      {ascending ? '↑' : '↓'}
    </CursorText>
  )
}
