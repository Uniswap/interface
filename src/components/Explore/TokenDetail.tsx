import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import useTokenPrice from 'hooks/useTokenPrice'
import { TimePeriod } from 'hooks/useTopTokens'
import { atom, useAtom } from 'jotai'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Heart, Share } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { favoritesAtom } from './TokenTable'

const ArrowCell = styled.div`
  padding-left: 2px;
  display: flex;
`

const BreadcrumbContainer = styled.div`
  display: flex;
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  gap: 8px;
`

const ChartAreaContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 832px;
  gap: 20px;
`
const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  color: ${({ theme }) => theme.text1};
  gap: 8px;
`
const DeltaContainer = styled.div`
  display: flex;
  font-size: 16px;
`
const TokenInfoHeaderCell = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
`
const TokenActions = styled.div`
  display: flex;
  justify-content: right;
  gap: 24px;
  color: ${({ theme }) => theme.text2};
`
const TokenInfoContainer = styled.div`
  width: 100%;
  display: flex;
`
const TokenPrice = styled.span`
  font-size: 36px;
  line-height: 44px;
`
const TokenSymbol = styled.span`
  color: ${({ theme }) => theme.text2};
`

export default function TokenDetail({ tokenAddress }: { tokenAddress: string }) {
  const token = useToken(tokenAddress)
  const tokenName = token?.name
  const tokenSymbol = token?.symbol

  const [favoriteTokens, updateFavoriteTokens] = useAtom(favoritesAtom)
  const isTokenFavorited = atom<boolean>(favoriteTokens.includes(tokenAddress))
  const theme = useTheme()
  const set = new Set<string>()
  const currencyLogo = useCurrency(tokenAddress)
  set.add(tokenAddress)
  const { data, loading, error } = useTokenPrice(set)
  if (error || data === null) return <div></div>
  const tokenDetails = data[tokenAddress]
  const tokenPrice = tokenDetails.price
  const timePeriod = TimePeriod.hour
  const tokenDelta = tokenDetails.delta[timePeriod]
  if (tokenDelta === undefined) return <div></div>
  const deltaSign = Math.sign(tokenDelta) > 0 ? '+' : '-'

  return (
    <ChartAreaContainer>
      <BreadcrumbContainer>
        <ArrowLeft size={10} /> Explore
      </BreadcrumbContainer>
      <ChartHeader>
        <TokenInfoContainer>
          <TokenInfoHeaderCell>
            <CurrencyLogo currency={currencyLogo} />
            {tokenName} <TokenSymbol>{tokenSymbol}</TokenSymbol>
          </TokenInfoHeaderCell>
          <TokenActions>
            <Share size={18} />
            <Heart
              size={15}
              color={isTokenFavorited ? theme.primary1 : undefined}
              fill={isTokenFavorited ? theme.primary1 : undefined}
            />
          </TokenActions>
        </TokenInfoContainer>
        <TokenPrice>${tokenPrice}</TokenPrice>
        <DeltaContainer>
          {deltaSign}
          {tokenDelta}%
          <ArrowCell>
            {deltaSign === '+' ? (
              <ArrowUpRight size={16} color={theme.green1} />
            ) : (
              <ArrowDownRight size={16} color={theme.red1} />
            )}
          </ArrowCell>
        </DeltaContainer>
      </ChartHeader>
    </ChartAreaContainer>
  )
}
