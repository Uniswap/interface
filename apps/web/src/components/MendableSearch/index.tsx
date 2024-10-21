import { MendableSearchBar } from '@mendable/search'
import { RowFixed } from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { useIsDarkMode } from 'theme/components/ThemeToggle'

const StyledSearch = styled.div`
  position: fixed;
  display: flex;
  align-items: center;
  right: 0;
  bottom: 2rem;
  padding: 1rem;
  color: theme.deprecated_yellow3;
  transition: 250ms ease color;

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToMedium`
    display: none;
  `}
`

export default function MendableSearch() {
  const isDarkMode = useIsDarkMode()

  return (
    <>
      <RowFixed>
        <StyledSearch>
          <MendableSearchBar
            style={{ darkMode: isDarkMode, accentColor: '#8559F4' }}
            placeholder="Ask me anything"
            dialogPlaceholder="What are you looking for?"
            anon_key="eea51742-1c13-4611-90b1-581dce6ca930"
          />
        </StyledSearch>
      </RowFixed>
    </>
  )
}
