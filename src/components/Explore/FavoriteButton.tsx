import useTheme from 'hooks/useTheme'
import { Heart } from 'react-feather'
import styled from 'styled-components/macro'

const FavoriteButtonContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`
const FavoriteButtonContainer = styled.button`
  padding: 0px 16px;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.bg0};
  border: 1px solid ${({ theme }) => theme.bg0};
  color: ${({ theme }) => theme.text1};
  font-size: 16px;

  :hover,
  :focus {
    cursor: pointer;
    outline: none;
    border: 1px solid ${({ theme }) => theme.bg3};
  }
`

export default function FavoriteButton() {
  const theme = useTheme()
  return (
    <FavoriteButtonContainer>
      <FavoriteButtonContent>
        <Heart size={17} color={theme.text1} fill={theme.text1} /> Favorites
      </FavoriteButtonContent>
    </FavoriteButtonContainer>
  )
}
