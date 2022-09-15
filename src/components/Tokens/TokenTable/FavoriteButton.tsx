import { Trans } from '@lingui/macro'
import { useAtom } from 'jotai'
import { Heart } from 'react-feather'
import styled, { useTheme } from 'styled-components/macro'

import { SMALLEST_MOBILE_MEDIA_BREAKPOINT } from '../constants'
import { showFavoritesAtom } from '../state'
import FilterOption from './FilterOption'

const FavoriteButtonContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`
const FavoriteText = styled.span`
  @media only screen and (max-width: ${SMALLEST_MOBILE_MEDIA_BREAKPOINT}) {
    display: none;
  }
`

export default function FavoriteButton() {
  const theme = useTheme()
  const [showFavorites, setShowFavorites] = useAtom(showFavoritesAtom)
  return (
    <FilterOption onClick={() => setShowFavorites(!showFavorites)} active={showFavorites} highlight>
      <FavoriteButtonContent>
        <Heart size={20} color={showFavorites ? theme.accentActive : theme.textPrimary} />
        <FavoriteText>
          <Trans>Favorites</Trans>
        </FavoriteText>
      </FavoriteButtonContent>
    </FilterOption>
  )
}
