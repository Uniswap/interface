import useTheme from 'hooks/useTheme'
import { useState } from 'react'
import { Search } from 'react-feather'
import styled from 'styled-components/macro'

const StyledSearchBar = styled.div<{ focused: boolean }>`
  display: flex;
  width: 100%;
  justify-content: center;
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  background-color: ${({ theme, focused }) => (focused ? theme.bg2 : theme.bg0)};
  color: ${({ theme }) => theme.text2};
  font-size: 16px;
`
const SearchInput = styled.input`
  width: 90%;
  background-color: transparent;
  border: none;
  font-size: 16px;
  color: ${({ theme }) => theme.text2};

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.bg2};
  }
  ::placeholder {
    color: ${({ theme }) => theme.text3};
  }
`

export default function SearchBar() {
  const theme = useTheme()
  const [isFocused, setFocused] = useState(false)
  return (
    <StyledSearchBar focused={isFocused}>
      <Search size={20} color={theme.text3} />
      <SearchInput
        type="text"
        placeholder="Search token or paste address"
        id="searchBar"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </StyledSearchBar>
  )
}
