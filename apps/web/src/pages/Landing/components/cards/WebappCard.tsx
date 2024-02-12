import { t } from '@lingui/macro'
import tokenLogoLookup from 'constants/tokenLogoLookup'
import styled from 'styled-components'

import { Box } from '../Generics'
import { Computer } from '../Icons'
import { PriceArrowDown, PriceArrowUp } from '../Icons'
import { PillButton } from './PillButton'
import ValuePropCard from './ValuePropCard'

const Contents = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
  position: absolute;
  width: 100%;
  bottom: 0;
  padding: 32px;
  padding-bottom: 32px;
  @media (max-width: 768px) {
    padding: 24px;
    padding-bottom: 32px;
  }
`
const TokenImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 100%;
  background-color: ${({ theme }) => theme.surface2};
`
const TokenRow = styled.div`
  width: 100%;
  height: 80px;
  padding: 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.surface1};
`
const TokenName = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 32px; /* 133.333% */
  color: ${(props) => props.color || props.theme.neutral1};
`
const TokenTicker = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 32px; /* 133.333% */
  color: ${(props) => props.color || props.theme.neutral2};
`
const TokenPrice = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 32px; /* 133.333% */
  color: ${(props) => props.color || props.theme.neutral1};
`
const TokenDelta = styled.h3`
  padding: 0;
  margin: 0;
  font-family: Basel;
  font-size: 24px;
  font-style: normal;
  font-weight: 500;
  line-height: 32px; /* 133.333% */
  color: ${(props) => (props.color === 'red' ? props.theme.critical : props.theme.success)};
`

type WebappCardProps = {
  isDarkMode?: boolean
  tagText?: string
}

const primary = '#627EEA'

export function WebappCard(props: WebappCardProps) {
  const tokens = [
    {
      name: 'Ether',
      image: tokenLogoLookup.getIcons('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2')?.[0],
      ticker: 'ETH',
      currentPrice: 1234,
      priceChange: 0.54,
      sparkline: '',
    },
    {
      name: 'USDC',
      image: '',
      ticker: 'USDC',
      currentPrice: 1.01,
      priceChange: 0.01,
      sparkline: '',
    },
    {
      name: 'UNI',
      image: '',
      ticker: 'UNI',
      currentPrice: 1.01,
      priceChange: 0.01,
      sparkline: '',
    },
    {
      name: 'Dai',
      image: '',
      ticker: 'DAI',
      currentPrice: 1.01,
      priceChange: 0.01,
      sparkline: '',
    },
    {
      name: 'Dai',
      image: '',
      ticker: 'DAI',
      currentPrice: 1.01,
      priceChange: 0.01,
      sparkline: '',
    },
  ]
  return (
    <ValuePropCard
      href="https://app.uniswap.org"
      height="696px"
      minHeight="450px"
      isDarkMode={props.isDarkMode}
      textColor={primary}
      backgroundColor={{ dark: 'rgba(98, 126, 234, 0.20)', light: 'rgba(98, 126, 234, 0.10)' }}
      button={<PillButton color={primary} label="Web app" icon={<Computer size="24px" fill={primary} />} />}
      titleText={t`Swapping made simple. Access thousands of tokens on 7+ chains.`}
    >
      <Contents>
        {tokens.map((token, index) => (
          <TokenRow key={`tokenRow-${index}-${token.name}`}>
            <Box width="auto" gap="8px" align="center">
              <TokenImage src={token.image} alt={token.name} />
              <TokenName>{token.name}</TokenName>
              <TokenTicker>{token.ticker}</TokenTicker>
            </Box>
            <Box width="auto" gap="8px" align="center">
              <TokenPrice>{token.currentPrice}</TokenPrice>
              {token.priceChange < 0 ? <PriceArrowDown /> : <PriceArrowUp />}
              <TokenDelta color={token.priceChange < 0 ? 'red' : 'green'}>{token.priceChange}</TokenDelta>
            </Box>
          </TokenRow>
        ))}
      </Contents>
    </ValuePropCard>
  )
}
