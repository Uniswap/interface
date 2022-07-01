import useTheme from 'hooks/useTheme'
import { useAtom } from 'jotai'
import { showFavoritesAtom } from 'pages/Explore/index'
import { Heart } from 'react-feather'
import styled from 'styled-components/macro'

const FavoriteButtonContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`
const FavoritesButton = styled.button`
  padding: 0px 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg0};
  color: ${({ theme }) => theme.text1};
  font-size: 16px;
  cursor: pointer;

  :hover {
    outline: none;
    border: 1px solid ${({ theme }) => theme.bg3};
  }
`

export default function FavoriteButton() {
  const theme = useTheme()
  const [showFavorites, setShowFavorites] = useAtom(showFavoritesAtom)
  return (
    <FavoritesButton onClick={() => setShowFavorites(!showFavorites)}>
      <FavoriteButtonContent>
        <Heart size={17} color={theme.text1} fill={theme.text1} /> Favorites
      </FavoriteButtonContent>
    </FavoritesButton>
  )
}
