import useTheme from 'hooks/useTheme'
import { useAtom } from 'jotai'
import { Heart } from 'react-feather'
import styled from 'styled-components/macro'

import { showFavoritesAtom } from '../state'

const FavoriteButtonContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`
const StyledFavoriteButton = styled.button<{ active: boolean }>`
  padding: 0px 16px;
  border-radius: 16px;
  background-color: ${({ theme, active }) => (active ? theme.accentActionSoft : theme.none)};
  border: 1px solid ${({ theme, active }) => (active ? theme.accentActiveSoft : theme.backgroundOutline)};
  color: ${({ theme, active }) => (active ? theme.blue200 : theme.textPrimary)};
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;

  :hover {
    background-color: ${({ theme, active }) => !active && theme.backgroundContainer};
  }
`

export default function FavoriteButton() {
  const theme = useTheme()
  const [showFavorites, setShowFavorites] = useAtom(showFavoritesAtom)
  const heartColor = showFavorites ? theme.blue200 : theme.textPrimary
  return (
    <StyledFavoriteButton onClick={() => setShowFavorites(!showFavorites)} active={showFavorites}>
      <FavoriteButtonContent>
        <Heart size={17} color={heartColor} fill={heartColor} />
        Favorites
      </FavoriteButtonContent>
    </StyledFavoriteButton>
  )
}
