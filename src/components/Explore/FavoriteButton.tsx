import useTheme from 'hooks/useTheme'
import { useAtom } from 'jotai'
import { showFavoritesAtom } from 'pages/Explore/index'
import { darken } from 'polished'
import { Heart } from 'react-feather'
import styled from 'styled-components/macro'

const FavoriteButtonContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`
const StyledFavoriteButton = styled.button<{ active: any }>`
  padding: 0px 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme, active }) => (active ? '#869EFF' : theme.bg1)};
  color: ${({ theme, active }) => (active ? '#869EFF' : theme.text1)};
  font-size: 16px;
  cursor: pointer;

  &:hover {
    outline: none;
    color: ${({ theme }) => darken(0.08, theme.text1)};
  }
`

export default function FavoriteButton() {
  const theme = useTheme()
  const [showFavorites, setShowFavorites] = useAtom(showFavoritesAtom)
  return (
    <StyledFavoriteButton onClick={() => setShowFavorites(!showFavorites)} active={showFavorites}>
      <FavoriteButtonContent>
        <Heart
          size={17}
          color={showFavorites ? '#869EFF' : theme.text1}
          fill={showFavorites ? '#869EFF' : theme.text1}
        />{' '}
        Favorites
      </FavoriteButtonContent>
    </StyledFavoriteButton>
  )
}
