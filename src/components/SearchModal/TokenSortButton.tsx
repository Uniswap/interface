import React from 'react'
import { Text } from 'rebass'
import { FilterWrapper } from './styleds'

export function TokenSortButton({
  title,
  toggleSortOrder,
  invertSearchOrder
}: {
  title: string
  toggleSortOrder: () => void
  invertSearchOrder: boolean
}) {
  return (
    <FilterWrapper onClick={toggleSortOrder}>
      <Text fontSize={14} fontWeight={500}>
        {title}
      </Text>
      <Text fontSize={14} fontWeight={500}>
        {!invertSearchOrder ? '↓' : '↑'}
      </Text>
    </FilterWrapper>
  )
}
