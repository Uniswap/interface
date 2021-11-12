import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Currency } from '@swapr/sdk'
import { Text } from 'rebass'

import { useRouter } from '../../hooks/useRouter'
import Card from '../../components/Card'
import { AutoRow } from '../../components/Row'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'

const LightCardWrap = styled(Card)`
  background: linear-gradient(113.18deg, rgba(255, 255, 255, 0.35) -0.1%, rgba(0, 0, 0, 0) 98.9%),
    ${({ theme }) => theme.dark1};
  background-blend-mode: overlay, normal;
  padding: 0.8rem;
  width: calc(25% - 6px);
  padding: 24px 30px;
  display: flex;
  flex-wrap: wrap;
  cursor: pointer;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: calc(33% - 4px);
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: calc(50% - 4px);
  `};
  position: relative;

  ::before {
    content: '';
    background-image: linear-gradient(180deg, ${({ theme }) => theme.bg2} 0%, ${({ theme }) => theme.bg3} 100%);
    top: -1px;
    left: -1px;
    bottom: -1px;
    right: -1px;
    position: absolute;
    z-index: -1;
    border-radius: 8px;
  }
`

const TextCard = styled(Card)`
  background: linear-gradient(113.18deg, #ffffff -0.1%, rgba(0, 0, 0, 0) 98.9%), #28263f;
  background-blend-mode: overlay, normal;
  border-radius: 4px;
  height: 15px;
  padding: 3px 5px;
  align-items: center;
  margin-top: 8px;
  width: auto;
`

const LogoContainer = styled.div<{ size: number }>`
  margin: auto;
  padding-left: ${props => `${props.size / 2}px`};
`

interface CardProps {
  currency: Currency
  currency1?: Currency
  apy?: number
  proposals?: number
}

export const GovCard = ({ currency, currency1, apy, proposals }: CardProps) => {
  const doubleCurrencyLogoSize = 26.88

  const theme = useContext(ThemeContext)
  const router = useRouter()

  const onClick = () => {
    router.push({
      pathname: `/governance/${currency.symbol}/pairs`,
      state: {
        currency: currency
      }
    })
  }

  if (currency1 === undefined) {
    // main governance page
    return (
      <LightCardWrap onClick={onClick}>
        <AutoRow align="flex-end" justify="center">
          <CurrencyLogo size="20px" currency={currency} />
          <Text width="auto" marginTop="0" marginLeft="6px" fontWeight={600} fontSize="16px" lineHeight="20px">
            {currency.symbol}
          </Text>
        </AutoRow>
        <AutoRow align="center" justify="center">
          <TextCard>
            <Text color={theme.text2} fontWeight={600} fontSize="9px" lineHeight="9px" textAlign="center">
              {apy + '% APR'}
            </Text>
          </TextCard>
        </AutoRow>
      </LightCardWrap>
    )
  } else {
    // pair page
    return (
      <LightCardWrap>
        <AutoRow align="flex-end" justify="center">
          <LogoContainer size={doubleCurrencyLogoSize}>
            <DoubleCurrencyLogo size={doubleCurrencyLogoSize} currency0={currency1} currency1={currency} />
          </LogoContainer>
        </AutoRow>
        <AutoRow align="flex-start" justify="center">
          <Text width="auto" marginTop="6px" fontWeight={600} fontSize="16px" lineHeight="19.5px">
            {currency.symbol}/{currency1.symbol}
          </Text>
        </AutoRow>
        <AutoRow align="flex-start" justify="center">
          <TextCard>
            <Text
              color={theme.text1}
              fontWeight={600}
              fontSize="9px"
              lineHeight="9px"
              textAlign="center"
              letterSpacing="0.08em"
              fontStyle="normal"
            >
              {proposals + ' PROPOSALS'}
            </Text>
          </TextCard>
        </AutoRow>
      </LightCardWrap>
    )
  }
}
