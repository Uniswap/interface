import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import { TimePeriod } from 'hooks/useTopTokens'
import { atom, useAtom } from 'jotai'
import { useState } from 'react'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Heart, Share } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import { favoritesAtom } from './TokenTable'

const TIME_DISPLAYS: Record<TimePeriod, string> = {
  [TimePeriod.hour]: '1H',
  [TimePeriod.day]: '1D',
  [TimePeriod.week]: '1W',
  [TimePeriod.month]: '1M',
  [TimePeriod.year]: '1Y',
}
const TIME_PERIODS = [TimePeriod.hour, TimePeriod.day, TimePeriod.week, TimePeriod.month, TimePeriod.year]

const ArrowCell = styled.div`
  padding-left: 2px;
  display: flex;
`
const BreadcrumbNavLink = styled(Link)`
  display: flex;
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  margin-bottom: 16px;

  &:hover {
    text-decoration: underline;
  }
`
const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.text1};
  gap: 4px;
`
const ChartContainer = styled.div`
  height: 332px;
  border-bottom: 1px solid ${({ theme }) => theme.bg3};
`
const DeltaContainer = styled.div`
  display: flex;
  align-items: center;
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
const TimeOptionsContainer = styled.div`
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
const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
const TokenPrice = styled.span`
  font-size: 36px;
  line-height: 44px;
`
const TokenSymbol = styled.span`
  color: ${({ theme }) => theme.text2};
`
const TopArea = styled.div`
  width: 832px;
`

export default function TokenDetail({ address }: { address: string }) {
  const theme = useTheme()
  const token = useToken(address)
  const currency = useCurrency(address)
  const [favoriteTokens] = useAtom(favoritesAtom)
  const isFavorited = atom<boolean>(favoriteTokens.includes(address))
  const [activeTimePeriod, setTimePeriod] = useState(TimePeriod.hour)

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
            <Share size={18} />
            <Heart
              size={15}
              color={isFavorited ? theme.primary1 : undefined}
              fill={isFavorited ? theme.primary1 : undefined}
            />
          </TokenActions>
        </TokenInfoContainer>

        <TokenPrice>${tokenPrice}</TokenPrice>
        <DeltaContainer>
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
        <ChartContainer></ChartContainer>
        <TimeOptionsContainer>
          {TIME_PERIODS.map((timePeriod) => {
            return (
              <TimeButton
                key={timePeriod}
                active={activeTimePeriod === timePeriod}
                onClick={() => setTimePeriod(timePeriod)}
              >
                {TIME_DISPLAYS[timePeriod]}
              </TimeButton>
            )
          })}
        </TimeOptionsContainer>
      </ChartHeader>
    </TopArea>
  )
}
