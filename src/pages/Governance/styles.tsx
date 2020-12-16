import React, { useContext } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { LightCard } from '../../components/Card'
import { AutoRow } from '../../components/Row'
import { Text } from 'rebass'
import CurrencyLogo from '../../components/CurrencyLogo'
import DoubleCurrencyLogo from '../../components/DoubleLogo'

const LightCardWrap = styled(LightCard)`
  width: 155.5px;
  height: 96px;
  display: grid;
`
const StyledText = styled(Text)`
  text-wrap: none;
`
export const GovernanceCard = () => {
  const theme = useContext(ThemeContext)
  const shittyCounter = 2
  return (
    <LightCardWrap>
      <AutoRow justify="center">
        {shittyCounter !== 2 ? <DoubleCurrencyLogo overlap={9} size={26.25} /> : <CurrencyLogo size="20px" />}

        {shittyCounter !== 2 ? (
          <Text width="100%" textAlign="center" marginTop="8px" fontWeight={600} fontSize="16px" lineHeight="20px">
            DXD
          </Text>
        ) : (
          <Text marginLeft="6px" fontWeight={600} fontSize="16px" lineHeight="20px">
            DXD
          </Text>
        )}
      </AutoRow>
      <AutoRow justify="center">
        <StyledText
          marginTop={shittyCounter !== 2 ? '10px' : '0'}
          color={theme.text3}
          letterSpacing="0.02em"
          fontWeight={600}
          fontSize="9px"
          lineHeight="11px"
        >
          5 PAIRS | 3 PROPOSALS
        </StyledText>
      </AutoRow>
    </LightCardWrap>
  )
}
