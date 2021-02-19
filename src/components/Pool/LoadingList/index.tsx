import React from 'react'
import styled from 'styled-components'
import LoadingCard from './LoadingCard'

const ListLayout = styled.div`
  display: grid;
  grid-gap: 9px;
  grid-template-columns: auto auto auto auto;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto;
    grid-gap: 10px;
  `};
`

interface LoadingListProps {
  wideCards?: boolean
}

export default function LoadingList({ wideCards }: LoadingListProps) {
  return (
    <ListLayout>
      {new Array(wideCards ? 9 : 12).fill(null).map((_, index) => (
        <LoadingCard key={index} wide={wideCards} />
      ))}
    </ListLayout>
  )
}
