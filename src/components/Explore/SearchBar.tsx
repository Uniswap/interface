import useTheme from 'hooks/useTheme'
import { useAtom } from 'jotai'
import { useState } from 'react'
import { Search } from 'react-feather'
import styled from 'styled-components/macro'

import { filterStringAtom } from './state'

export const SMALL_MEDIA_BREAKPOINT = '580px'

const StyledSearchBar = styled.div<{ focused: boolean }>`
  display: flex;
  flex: 1;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  background-color: ${({ theme, focused }) => (focused ? theme.bg2 : theme.bg0)};
  color: ${({ theme }) => theme.text2};
  font-size: 16px;
  padding: 0px 12px;
`
const SearchInput = styled.input`
  background-color: transparent;
  border: none;
  width: 90%;
  font-size: 16px;
  color: ${({ theme }) => theme.text2};

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.bg2};
  }
  ::placeholder {
    color: ${({ theme }) => theme.text3};
    @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
      color: transparent;
    }
  }
`

export default function SearchBar() {
  const theme = useTheme()
  const [isFocused, setFocused] = useState(false)
  const [filterString, setFilterString] = useAtom(filterStringAtom)

  return (
    <StyledSearchBar focused={isFocused}>
      <Search size={20} color={theme.text3} />
      <SearchInput
        type="text"
        value={filterString}
        onChange={({ target: { value } }) => setFilterString(value)}
        placeholder="Search token or paste address"
        id="searchBar"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </StyledSearchBar>
  )
}
