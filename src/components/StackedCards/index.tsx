import React, { ReactNode } from 'react'
import styled from 'styled-components'
import { DarkCard } from '../Card'

const SizedCard = styled(DarkCard)<{ index: number }>`
  width: 155px;
  height: 147px;
  bottom: ${props => props.index * 4}px;
  position: absolute;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

const CardsContainer = styled.div`
  position: relative;
  width: 155px;
  height: 147px;
  ${props => props.theme.mediaWidth.upToMedium`
    width: 100%;
  `}
`

interface StackedCardsProps {
  children: ReactNode
}

export default function StackedCards({ children, ...rest }: StackedCardsProps) {
  return (
    <CardsContainer>
      <SizedCard index={0} />
      <SizedCard index={1} />
      <SizedCard index={2} selectable {...rest}>
        {children}
      </SizedCard>
    </CardsContainer>
  )
}
