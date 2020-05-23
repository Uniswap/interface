import React from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'
import { RowFixed } from '../Row'

export const FilterWrapper = styled(RowFixed)`
  padding: 8px;
  background-color: ${({ selected, theme }) => selected && theme.bg2};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.text2)};
  border-radius: 8px;
  user-select: none;
  & > * {
    user-select: none;
  }
  :hover {
    cursor: pointer;
  }
`

export default function SortButton({
  title,
  toggleSortOrder,
  ascending
}: {
  title: string
  toggleSortOrder: () => void
  ascending: boolean
}) {
  return (
    <FilterWrapper onClick={toggleSortOrder}>
      <Text fontSize={14} fontWeight={500}>
        {title}
      </Text>
      <Text fontSize={14} fontWeight={500}>
        {ascending ? '↑' : '↓'}
      </Text>
    </FilterWrapper>
  )
}
