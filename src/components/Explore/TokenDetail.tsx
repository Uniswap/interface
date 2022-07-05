import CurrencyLogo from 'components/CurrencyLogo'
import { useCurrency, useToken } from 'hooks/Tokens'
import { atom, useAtom } from 'jotai'
import { ArrowLeft, Heart, Share } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { favoritesAtom } from './TokenTable'

const ChartAreaContainer = styled.div`
  display: flex;
  flex-direction: column;
`
const MetaDataContainer = styled.div`
  display: flex;
`
const ChartHeader = styled.div`
  display: flex;
  justify-content: flex-start;
`
const TokenInfoHeaderCell = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 8px;
`
const TokenActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 24px;
`
const TokenInfoContainer = styled.div`
  display: flex;
`
const TokenSymbol = styled.span`
  color: ${({ theme }) => theme.text3};
`

export default function TokenDetail({ tokenAddress }: { tokenAddress: string }) {
  const token = useToken(tokenAddress)
  const tokenName = token?.name
  const tokenSymbol = token?.symbol

  const [favoriteTokens, updateFavoriteTokens] = useAtom(favoritesAtom)
  const isTokenFavorited = atom<boolean>(favoriteTokens.includes(tokenAddress))
  const theme = useTheme()

  return (
    <ChartAreaContainer>
      <ArrowLeft size={10} /> Explore
      <ChartHeader>
        <TokenInfoContainer>
          <TokenInfoHeaderCell>
            <CurrencyLogo currency={useCurrency(tokenAddress)} />
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
      </ChartHeader>
    </ChartAreaContainer>
  )
}
