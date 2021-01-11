import React from 'react'
import styled from 'styled-components'
import { ETHER } from 'dxswap-sdk'
import { GovCard } from './Card'
import { MainPage, PairPage, temporaryCurrencyData } from './constant'
import { AutoRowCleanGap } from '../../components/Row'

const CardContainer = styled(AutoRowCleanGap)`
  max-height: 330px;
  overflow-x: hidden;
  scrollbar-width: 'none';
  -ms-overflow-style: 'none';
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`

interface ContainerProps {
  currentPage: string
}

export default function Container({ currentPage }: ContainerProps) {
  const randomInteger = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  if (currentPage === MainPage) {
    return (
      <CardContainer gap={8}>
        {temporaryCurrencyData.map((currency, index) => (
          <GovCard
            key={index}
            currency={currency}
            pairs={randomInteger(index, 100)}
            proposals={randomInteger(index, 100)}
          />
        ))}
      </CardContainer>
    )
  } else if (currentPage === PairPage) {
    return (
      <CardContainer gap={8}>
        {temporaryCurrencyData.map((currency, index) => (
          <GovCard key={index} currency={currency} currency1={ETHER} />
        ))}
      </CardContainer>
    )
  } else {
    return <></>
  }
}
