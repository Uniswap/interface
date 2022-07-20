import useTheme from 'hooks/useTheme'
import { useAtom } from 'jotai'
import { darken } from 'polished'
import { Heart } from 'react-feather'
import styled from 'styled-components/macro'

import { showFavoritesAtom } from './state'

const FavoriteButtonContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`
const StyledFavoriteButton = styled.button<{ active: boolean }>`
  padding: 0px 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.deprecated_bg0};
  border: 1px solid ${({ theme, active }) => (active ? theme.deprecated_primary1 : theme.deprecated_bg1)};
  color: ${({ theme, active }) => (active ? theme.deprecated_blue5 : theme.deprecated_text1)};
  font-size: 16px;
  cursor: pointer;

  &:hover,
  &:focus {
    outline: none;
    color: ${({ theme, active }) => (active ? theme.deprecated_blue5 : darken(0.08, theme.deprecated_text1))};
  }
`

export default function FavoriteButton() {
  const theme = useTheme()
  const [showFavorites, setShowFavorites] = useAtom(showFavoritesAtom)
  const heartColor = showFavorites ? theme.deprecated_blue5 : theme.deprecated_text1
  return (
    <StyledFavoriteButton onClick={() => setShowFavorites(!showFavorites)} active={showFavorites}>
      <FavoriteButtonContent>
        <Heart size={17} color={heartColor} fill={heartColor} />
        Favorites
      </FavoriteButtonContent>
    </StyledFavoriteButton>
  )
}
