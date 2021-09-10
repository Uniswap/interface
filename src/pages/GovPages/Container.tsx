import React from 'react'
import styled from 'styled-components'
import { Currency } from '@swapr/sdk'
import { GovCard } from './Card'
import { MainPage, PairPage, temporaryCurrencyData } from './constant'
import { AutoRowCleanGap } from '../../components/Row'
import { Redirect } from 'react-router-dom'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'

const CardContainer = styled(AutoRowCleanGap)`
  max-height: 330px;
  overflow-x: hidden;
  scrollbar-width: 'none';
  -ms-overflow-style: 'none';
  padding: 1px;
  ::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
`

interface ContainerProps {
  currentPage: string
  currency?: Currency
}

export default function Container({ currentPage, currency }: ContainerProps) {
  const nativeCurrency = useNativeCurrency()

  const randomInteger = (min: number, max: number): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  if (currentPage === MainPage) {
    return (
      <CardContainer gap={8}>
        {temporaryCurrencyData.map((ele, index) => (
          <GovCard key={index} currency={ele} apy={152} />
        ))}
      </CardContainer>
    )
  } else if (currentPage === PairPage) {
    if (currency === undefined) {
      return <Redirect to="/" />
    } else {
      return (
        <CardContainer gap={8}>
          {temporaryCurrencyData.map((ele, index) => (
            <GovCard
              key={index}
              currency={currency}
              currency1={ele === currency ? nativeCurrency : ele}
              proposals={randomInteger(index, 100)}
            />
          ))}
        </CardContainer>
      )
    }
  } else {
    return <></>
  }
}
