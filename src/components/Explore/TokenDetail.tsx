import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import { TimePeriod } from 'hooks/useTopTokens'
import { useAtom } from 'jotai'
import { darken } from 'polished'
import { useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Copy, Heart } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import Resource from './Resource'
import ShareButton from './ShareButton'
import { favoritesAtom, useToggleFavorite } from './state'
import { ClickFavorited } from './TokenRow'

const TIME_DISPLAYS: Record<TimePeriod, string> = {
  [TimePeriod.hour]: '1H',
  [TimePeriod.day]: '1D',
  [TimePeriod.week]: '1W',
  [TimePeriod.month]: '1M',
  [TimePeriod.year]: '1Y',
}
const TIME_PERIODS = [TimePeriod.hour, TimePeriod.day, TimePeriod.week, TimePeriod.month, TimePeriod.year]

export const AboutSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 0px;
`
export const AboutHeader = styled.span`
  font-size: 28px;
  line-height: 36px;
`
const ArrowCell = styled.div`
  padding-left: 2px;
  display: flex;
`
export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  margin-bottom: 16px;

  &:hover {
    color: ${({ theme }) => darken(0.1, theme.text2)};
  }
`
export const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.text1};
  gap: 4px;
  margin-bottom: 24px;
`
const ContractAddress = styled.button`
  display: flex;
  color: ${({ theme }) => theme.text1};
  gap: 10px;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0px;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => darken(0.08, theme.text1)};
  }
`
export const ContractAddressSection = styled.div`
  padding: 24px 0px;
`
const Contract = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  gap: 4px;
`
export const ChartContainer = styled.div`
  display: flex;
  height: 332px;
  border-bottom: 1px solid ${({ theme }) => theme.bg3};
  align-items: center;
  overflow: hidden;
`
export const DeltaContainer = styled.div`
  display: flex;
  align-items: center;
`
const Stat = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  width: 168px;
  gap: 4px;
`
const StatPrice = styled.span`
  font-size: 28px;
  color: ${({ theme }) => theme.text1};
`
export const StatsSection = styled.div`
  display: flex;
  gap: 4px;
  padding: 24px 0px;
`
const TimeButton = styled.button<{ active: boolean }>`
  background-color: ${({ theme, active }) => (active ? theme.primary1 : 'transparent')};
  font-size: 14px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.text1};
`
export const TimeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
`
const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
`
const TokenActions = styled.div`
  display: flex;
  gap: 24px;
  color: ${({ theme }) => theme.text2};
`
export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
export const TokenPrice = styled.span`
  font-size: 36px;
  line-height: 44px;
`
const TokenSymbol = styled.span`
  color: ${({ theme }) => theme.text2};
`
export const TopArea = styled.div`
  width: 832px;
`
export const ResourcesContainer = styled.div`
  display: flex;
  gap: 14px;
`

export default function LoadedTokenDetail({ address }: { address: string }) {
  const theme = useTheme()
  const token = useToken(address)
  const currency = useCurrency(address)
  const [favoriteTokens] = useAtom(favoritesAtom)
  const [activeTimePeriod, setTimePeriod] = useState(TimePeriod.hour)
  const isFavorited = favoriteTokens.includes(address)
  const toggleFavorite = useToggleFavorite(address)

  // catch token error and loading state
  if (!token) {
    return <div>No Token</div>
  }
  const tokenName = token.name
  const tokenSymbol = token.symbol

  // dummy data for now until Jordan writes token detail hooks
  // TODO: format price, add sparkline
  const tokenPrice = '3,243.22'
  const tokenDelta = 1.22
  const isPositive = Math.sign(tokenDelta) > 0
  const deltaSign = isPositive ? '+' : '-'
  const aboutToken =
    'Ethereum is a decentralized computing platform that uses ETH (Ether) to pay transaction fees (gas). Developers can use Ethereum to run decentralized applications (dApps) and issue new crypto assets, known as Ethereum tokens.'
  const tokenMarketCap = '23.02B'
  const tokenVolume = '1.6B'
  return (
    <TopArea>
      <BreadcrumbNavLink to="/explore">
        <ArrowLeft size={14} /> Explore
      </BreadcrumbNavLink>
      <ChartHeader>
        <TokenInfoContainer>
          <TokenNameCell>
            <CurrencyLogo currency={currency} size={'32px'} />
            {tokenName} <TokenSymbol>{tokenSymbol}</TokenSymbol>
          </TokenNameCell>
          <TokenActions>
            <ShareButton />
            <ClickFavorited onClick={toggleFavorite}>
              <Heart
                size={15}
                color={isFavorited ? theme.primary1 : theme.text2}
                fill={isFavorited ? theme.primary1 : 'transparent'}
              />
            </ClickFavorited>
          </TokenActions>
        </TokenInfoContainer>
        <TokenPrice>${tokenPrice}</TokenPrice>
        <DeltaContainer>
          {' '}
          {deltaSign}
          {tokenDelta}%
          <ArrowCell>
            {isPositive ? (
              <ArrowUpRight size={16} color={theme.green1} />
            ) : (
              <ArrowDownRight size={16} color={theme.red1} />
            )}
          </ArrowCell>
        </DeltaContainer>
        <ChartContainer>{null}</ChartContainer>
        <TimeOptionsContainer>
          {TIME_PERIODS.map((timePeriod) => (
            <TimeButton
              key={timePeriod}
              active={activeTimePeriod === timePeriod}
              onClick={() => setTimePeriod(timePeriod)}
            >
              {TIME_DISPLAYS[timePeriod]}
            </TimeButton>
          ))}
        </TimeOptionsContainer>
      </ChartHeader>
      <AboutSection>
        <AboutHeader>
          <Trans>About</Trans>
        </AboutHeader>{' '}
        {aboutToken}
        <ResourcesContainer>
          <Resource name={'Etherscan'} link={'https://etherscan.io/'} />
          <Resource name={'Protocol Info'} link={`https://info.uniswap.org/#/tokens/${address}`} />
        </ResourcesContainer>
      </AboutSection>
      <StatsSection>
        <Stat>
          Market Cap<StatPrice>${tokenMarketCap}</StatPrice>
        </Stat>
        <Stat>
          {TIME_DISPLAYS[activeTimePeriod]} Volume
          <StatPrice>${tokenVolume}</StatPrice>
        </Stat>
      </StatsSection>
      <ContractAddressSection>
        <Contract>
          Contract Address
          <ContractAddress onClick={() => navigator.clipboard.writeText(address)}>
            {address} <Copy size={13} color={theme.text2} />
          </ContractAddress>
        </Contract>
      </ContractAddressSection>
    </TopArea>
  )
}
