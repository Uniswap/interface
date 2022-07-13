import useTheme from 'hooks/useTheme'
import { useRef, useState } from 'react'
import { Search, X } from 'react-feather'
import styled from 'styled-components/macro'

export const SMALL_MEDIA_BREAKPOINT = '580px'

const StyledSearchBar = styled.div<{ focused: boolean; expanded: boolean }>`
  display: flex;
  flex: 1;
  max-width: ${({ expanded }) => !expanded && '44px'};
  align-items: center;
  gap: 8px;
  border-radius: 12px;
  background-color: ${({ theme, focused }) => (focused ? theme.bg2 : theme.bg0)};
  color: ${({ theme }) => theme.text2};
  font-size: 16px;
  padding: 0px 12px;
  cursor: pointer;
`
const SearchInput = styled.input<{ expanded: boolean }>`
  background-color: transparent;
  border: none;
  width: 92%;
  font-size: 16px;
  color: ${({ theme }) => theme.text2};
  display: ${({ expanded }) => !expanded && 'none'};
  animation: ${({ expanded }) => expanded && 'expand 0.8s'};
  @keyframes expand {
    from {
      width: 0%;
    }
    to {
      width: 92%;
    }
  }

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
  const [isExpanded, setExpanded] = useState(false)
  const [searchContent, setSearchContent] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const clickSearchIcon = () => {
    setExpanded(true)
    setFocused(true)

    if (searchRef.current) {
      searchRef.current.focus()
    }
  }
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchContent(event.target.value)
  }

  return (
    <StyledSearchBar focused={isFocused} onClick={() => clickSearchIcon()} expanded={isExpanded}>
      <Search size={18} color={theme.text3} />
      <SearchInput
        expanded={isExpanded}
        type="text"
        placeholder="Search token or paste address"
        id="searchBar"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="off"
        value={searchContent}
        onChange={handleSearchChange}
        ref={searchRef}
      />
      <X
        size={20}
        color={theme.text3}
        onClick={() => setSearchContent('')}
        display={searchContent.length === 0 ? 'none' : 'show'}
      />
    </StyledSearchBar>
  )
}
