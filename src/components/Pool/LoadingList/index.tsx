import React from 'react'
import styled from 'styled-components'
import { useResponsiveItemsPerPage } from '../../../hooks/useResponsiveItemsPerPage'
import LoadingCard from './LoadingCard'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 10px;
  grid-template-columns: auto auto auto;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto auto;
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    grid-template-columns: auto;
  `};
`

interface LoadingListProps {
  itemsAmount?: number
}

export default function LoadingList({ itemsAmount }: LoadingListProps) {
  const responsiveItemsAmount = useResponsiveItemsPerPage()

  return (
    <ListLayout>
      {new Array(itemsAmount && itemsAmount !== 0 ? itemsAmount : responsiveItemsAmount).fill(null).map((_, index) => (
        <LoadingCard key={index} />
      ))}
    </ListLayout>
  )
}
