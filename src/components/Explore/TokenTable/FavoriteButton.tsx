import { useAtom } from 'jotai'
import { Heart } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { SMALL_MEDIA_BREAKPOINT } from '../constants'
import { showFavoritesAtom } from '../state'

const FavoriteButtonContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`
const StyledFavoriteButton = styled.button<{ active: boolean }>`
  padding: 0px 16px;
  border-radius: 12px;
  background-color: ${({ theme, active }) => (active ? theme.accentAction : theme.backgroundInteractive)};
  border: none;
  color: ${({ theme }) => theme.textPrimary};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  :hover {
    background-color: ${({ theme, active }) => !active && theme.backgroundModule};
  }
`
const FavoriteText = styled.span`
  @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

export default function FavoriteButton() {
  const theme = useTheme()
  const [showFavorites, setShowFavorites] = useAtom(showFavoritesAtom)
  return (
    <StyledFavoriteButton onClick={() => setShowFavorites(!showFavorites)} active={showFavorites}>
      <FavoriteButtonContent>
        <Heart size={17} color={theme.textPrimary} fill="transparent" />
        <FavoriteText>Favorites</FavoriteText>
      </FavoriteButtonContent>
    </StyledFavoriteButton>
  )
}
