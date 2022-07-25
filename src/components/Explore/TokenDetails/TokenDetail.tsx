import { Trans } from '@lingui/macro'
import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import { TimePeriod } from 'hooks/useTopTokens'
import { useAtomValue } from 'jotai/utils'
import { useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Copy, Heart } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import { MOBILE_MEDIA_BREAKPOINT } from '../constants'
import { favoritesAtom, useToggleFavorite } from '../state'
import { ClickFavorited } from '../TokenTable/TokenRow'
import Resource from './Resource'
import ShareButton from './ShareButton'

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
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  margin-bottom: 16px;

  &:hover {
    color: ${({ theme }) => theme.textTertiary};
  }
`
export const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textPrimary};
  gap: 4px;
  margin-bottom: 24px;
`
const ContractAddress = styled.button`
  display: flex;
  color: ${({ theme }) => theme.textPrimary};
  gap: 10px;
  align-items: center;
  background: transparent;
  border: none;
  padding: 0px;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.textSecondary};
  }
`
export const ContractAddressSection = styled.div`
  padding: 24px 0px;
`
const Contract = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  gap: 4px;
`
export const ChartContainer = styled.div`
  display: flex;
  height: 332px;
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  align-items: center;
  overflow: hidden;
`
export const DeltaContainer = styled.div`
  display: flex;
  align-items: center;
`
export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  min-width: 168px;
  flex: 1;
  gap: 4px;
  padding: 24px 0px;
`
const StatPrice = styled.span`
  font-size: 28px;
  color: ${({ theme }) => theme.textPrimary};
`
export const StatsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
`
const StatPair = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
`
const TimeButton = styled.button<{ active: boolean }>`
  background-color: ${({ theme, active }) => (active ? theme.accentActive : 'transparent')};
  font-size: 14px;
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};
`
export const TimeOptionsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
`
export const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
`
const TokenActions = styled.div`
  display: flex;
  gap: 24px;
  color: ${({ theme }) => theme.textSecondary};
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
  color: ${({ theme }) => theme.textSecondary};
`
export const TopArea = styled.div`
  max-width: 832px;
`
export const ResourcesContainer = styled.div`
  display: flex;
  gap: 14px;
`
const FullAddress = styled.span`
  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`
const TruncatedAddress = styled.span`
  display: none;
  @media only screen and (max-width: ${MOBILE_MEDIA_BREAKPOINT}) {
    display: flex;
  }
`

export default function LoadedTokenDetail({ address }: { address: string }) {
  const theme = useTheme()
  const token = useToken(address)
  const currency = useCurrency(address)
  const favoriteTokens = useAtomValue<string[]>(favoritesAtom)
  const [activeTimePeriod, setTimePeriod] = useState(TimePeriod.hour)
  const isFavorited = favoriteTokens.includes(address)
  const toggleFavorite = useToggleFavorite(address)

  // catch token error and loading state
  if (!token || !token.name || !token.symbol) {
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
  const truncatedTokenAddress = `${address.slice(0, 4)}...${address.slice(-3)}`
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
            <ShareButton tokenName={tokenName} tokenSymbol={tokenSymbol} />
            <ClickFavorited onClick={toggleFavorite}>
              <Heart
                size={15}
                color={isFavorited ? theme.deprecated_primary1 : theme.deprecated_text2}
                fill={isFavorited ? theme.deprecated_primary1 : 'transparent'}
              />
            </ClickFavorited>
          </TokenActions>
        </TokenInfoContainer>
        <TokenPrice>${tokenPrice}</TokenPrice>
        <DeltaContainer>
          {deltaSign}
          {tokenDelta}%
          <ArrowCell>
            {isPositive ? (
              <ArrowUpRight size={16} color={theme.deprecated_green1} />
            ) : (
              <ArrowDownRight size={16} color={theme.deprecated_red1} />
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
        </AboutHeader>
        {aboutToken}
        <ResourcesContainer>
          <Resource name={'Etherscan'} link={'https://etherscan.io/'} />
          <Resource name={'Protocol Info'} link={`https://info.uniswap.org/#/tokens/${address}`} />
        </ResourcesContainer>
      </AboutSection>
      <StatsSection>
        <StatPair>
          <Stat>
            Market cap<StatPrice>${tokenMarketCap}</StatPrice>
          </Stat>
          <Stat>
            {TIME_DISPLAYS[activeTimePeriod]} volume
            <StatPrice>${tokenVolume}</StatPrice>
          </Stat>
        </StatPair>
        <StatPair>
          <Stat>
            52W low
            <StatPrice>$1,790.01</StatPrice>
          </Stat>
          <Stat>
            52W high
            <StatPrice>$4,420.71</StatPrice>
          </Stat>
        </StatPair>
      </StatsSection>
      <ContractAddressSection>
        <Contract>
          Contract Address
          <ContractAddress onClick={() => navigator.clipboard.writeText(address)}>
            <FullAddress>{address}</FullAddress>
            <TruncatedAddress>{truncatedTokenAddress}</TruncatedAddress>
            <Copy size={13} color={theme.deprecated_text2} />
          </ContractAddress>
        </Contract>
      </ContractAddressSection>
    </TopArea>
  )
}
