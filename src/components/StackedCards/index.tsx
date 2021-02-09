import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { DarkCard } from '../Card'

const SizedCard = styled(DarkCard)<{ index: number }>`
  width: 155px;
  height: 147px;
  bottom: ${props => props.index * 4}px;
  position: absolute;
`

const CardsContainer = styled.div`
  position: relative;
  width: 155px;
  height: 147px;
`

interface StackedCardsProps {
  children: ReactNode
}

export default function StackedCards({ children }: StackedCardsProps) {
  return (
    <CardsContainer>
      <SizedCard index={0} />
      <SizedCard index={1} />
      <SizedCard index={2} selectable>
        {children}
      </SizedCard>
    </CardsContainer>
  )
}
