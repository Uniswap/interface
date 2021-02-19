import React from 'react'
import styled from 'styled-components'
import LoadingCard from './LoadingCard'

const ListLayout = styled.div<{ wide: boolean }>`
  display: grid;
  grid-gap: 9px;
  grid-template-columns: ${props => (props.wide ? '208px 208px 208px' : '155px 155px 155px 155px')};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: auto;
  `};
`

interface LoadingListProps {
  wideCards?: boolean
}

export default function LoadingList({ wideCards }: LoadingListProps) {
  return (
    <ListLayout wide={!!wideCards}>
      {new Array(wideCards ? 9 : 12).fill(null).map((_, index) => (
        <LoadingCard key={index} wide={wideCards} />
      ))}
    </ListLayout>
  )
}
