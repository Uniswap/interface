import React from 'react'
import styled from 'styled-components'
import { Text } from 'rebass'
import { transparentize } from 'polished'
import { Currency } from 'dxswap-sdk'

import Card from '../../components/Card'
import { AutoRow } from '../../components/Row'
import DoubleCurrencyLogo from '../../components/DoubleLogo'

const LightCardWrap = styled(Card)`
  border: 1px solid ${({ theme }) => transparentize(0.3, theme.bg2)};
  background-color: ${({ theme }) => transparentize(0.3, theme.bg1)};
  padding: 0.8rem;
  width: calc(25% - 6px);
  height: 96px;
  display: flex;
  flex-wrap: wrap;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: calc(33% - 4px);
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: calc(50% - 4px);
  `};
`

interface CardProps {
  currency0: Currency
  currency1: Currency
}

export const PairCard = ({ currency0, currency1 }: CardProps) => (
  <LightCardWrap>
    <AutoRow align="flex-end" justify="center">
      <div style={{ margin: 'auto', paddingLeft: '13.44px' }}>
        <DoubleCurrencyLogo size={26.88} currency0={currency0} currency1={currency1} />
      </div>
    </AutoRow>
    <AutoRow align="flex-start" justify="center">
      <Text width="auto" marginTop="6px" fontWeight={600} fontSize="16px" lineHeight="20px">
        {currency0.symbol}/{currency1.symbol}
      </Text>
    </AutoRow>
  </LightCardWrap>
)
