import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import Card from '../../components/Card'
import { AutoRow } from '../../components/Row'
import { Text } from 'rebass'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { transparentize } from 'polished'
import { Currency } from 'dxswap-sdk'
import { useRouter } from '../../hooks/useRouter'

const LightCardWrap = styled(Card)`
  border: 1px solid ${({ theme }) => transparentize(0.3, theme.bg2)};
  background-color: ${({ theme }) => transparentize(0.3, theme.bg1)};
  padding: 0.8rem;
  width: calc(25% - 6px);
  height: 96px;
  display: flex;
  flex-wrap: wrap;
  cursor: pointer;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: calc(33% - 4px);
  `};
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: calc(50% - 4px);
  `};
`

const LogoContainer = styled.div<{ size: number }>`
  margin: auto;
  padding-left: ${props => `${props.size / 2}px`};
`

interface CardProps {
  currency: Currency
  currency1?: Currency
  pairs?: number
  proposals?: number
}

export const GovCard = ({ currency, currency1, pairs, proposals }: CardProps) => {
  const doubleCurrencyLogoSize = 26.88

  const theme = useContext(ThemeContext)
  const router = useRouter()

  const onClick = () => {
    router.push(`/governance/${currency.symbol}/pairs`)
  }

  if (currency1 === undefined) {
    return (
      <LightCardWrap onClick={onClick}>
        <AutoRow align="flex-end" justify="center">
          <CurrencyLogo size="20px" currency={currency} />
          <Text width={'auto'} marginTop={'0'} marginLeft={'6px'} fontWeight={600} fontSize="16px" lineHeight="20px">
            {currency.symbol}
          </Text>
        </AutoRow>
        <AutoRow align="flex-start" justify="center">
          <Text
            marginTop="7px"
            color={theme.text4}
            letterSpacing="0.02em"
            fontWeight={600}
            fontSize="9px"
            lineHeight="11px"
            textAlign="center"
          >
            {pairs && pairs + (pairs > 1 ? ' PAIRS' : ' PAIR')}
            {proposals && ' | ' + proposals + (proposals > 1 ? ' PROPOSALS' : ' PROPOSAL')}
          </Text>
        </AutoRow>
      </LightCardWrap>
    )
  } else {
    return (
      <LightCardWrap>
        <AutoRow align="flex-end" justify="center">
          <LogoContainer size={doubleCurrencyLogoSize}>
            <DoubleCurrencyLogo size={doubleCurrencyLogoSize} currency0={currency} currency1={currency1} />
          </LogoContainer>
        </AutoRow>
        <AutoRow align="flex-start" justify="center">
          <Text width="auto" marginTop="6px" fontWeight={600} fontSize="16px" lineHeight="20px">
            {currency.symbol}/{currency1.symbol}
          </Text>
        </AutoRow>
      </LightCardWrap>
    )
  }
}
