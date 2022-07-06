import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import { atom, useAtom } from 'jotai'
import { ArrowDownRight, ArrowLeft, ArrowUpRight, Heart, Share } from 'react-feather'
import { Link } from 'react-router-dom'
import styled, { useTheme } from 'styled-components/macro'

import { favoritesAtom } from './TokenTable'

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

  &:hover {
    text-decoration: underline;
  }
`
const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  color: ${({ theme }) => theme.text1};
  gap: 4px;
`
const DeltaContainer = styled.div`
  display: flex;
  font-size: 16px;
  align-items: center;
`
const TokenNameCell = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
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
const TopArea = styled.div`
  display: flex;
  flex-direction: column;
  width: 832px;
  gap: 20px;
`

export default function TokenDetail({ address }: { address: string }) {
  const theme = useTheme()
  const token = useToken(address)
  const currency = useCurrency(address)
  const [favoriteTokens] = useAtom(favoritesAtom)
  const isFavorited = atom<boolean>(favoriteTokens.includes(address))

  if (!token) {
    return <div>No Token</div>
  }
  const tokenName = token.name
  const tokenSymbol = token.symbol

  // dummy data for now until Jordan writes token detail hooks
  const tokenPrice = 3243.22
  const tokenDelta = 1.22
  const deltaSign = Math.sign(tokenDelta) > 0 ? '+' : '-'

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
            {deltaSign === '+' ? (
              <ArrowUpRight size={16} color={theme.green1} />
            ) : (
              <ArrowDownRight size={16} color={theme.red1} />
            )}
          </ArrowCell>
        </DeltaContainer>
      </ChartHeader>
    </TopArea>
  )
}
