import React from 'react'
import styled from 'styled-components'
import { useResponsiveItemsPerPage } from '../../../hooks/useResponsiveItemsPerPage'
import LoadingCard from './LoadingCard'

const ListLayout = styled.div<{ wide: boolean }>`
  display: grid;
  grid-gap: 9px;
  grid-template-columns: ${props => (props.wide ? 'auto auto auto' : 'auto auto auto auto')};
  ${({ theme }) => theme.mediaWidth.upToMedium<{ wide: boolean }>`
    grid-template-columns: ${props => (props.wide ? 'auto auto' : ' auto auto auto')};
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall<{ wide: boolean }>`
    grid-template-columns: ${props => (props.wide ? 'auto' : ' auto auto')};
  `};
`

interface LoadingListProps {
  wideCards?: boolean
  doubleCircle?: boolean
  itemsAmount?: number
}

export default function LoadingList({ wideCards, doubleCircle, itemsAmount }: LoadingListProps) {
  const responsiveItemsAmount = useResponsiveItemsPerPage(!!wideCards)

  return (
    <ListLayout wide={!!wideCards}>
      {new Array(itemsAmount || responsiveItemsAmount).fill(null).map((_, index) => (
        <LoadingCard key={index} doubleCircle={doubleCircle} />
      ))}
    </ListLayout>
  )
}
