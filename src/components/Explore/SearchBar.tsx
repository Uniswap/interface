import useTheme from 'hooks/useTheme'
import { useRef, useState } from 'react'
import styled from 'styled-components/macro'

export const SMALL_MEDIA_BREAKPOINT = '580px'

const SearchBarWrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1;
`

const SearchInput = styled.input<{ expanded: boolean }>`
  background: no-repeat scroll 7px 7px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2399A1BD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-search'%3E%3Ccircle cx='11' cy='11' r='8'%3E%3C/circle%3E%3Cline x1='21' y1='21' x2='16.65' y2='16.65'%3E%3C/line%3E%3C/svg%3E");
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.bg0};
  left: 10px;
  border-radius: 12px;
  align-items: center;
  border: none;
  height: 100%;
  width: ${({ expanded }) => (expanded ? '100%' : '44px')};
  font-size: 16px;
  padding-left: 40px;
  color: ${({ theme }) => theme.text2};
  animation: ${({ expanded }) => expanded && 'expand 0.8s'};
  @keyframes expand {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.bg2};
  }
  ::placeholder {
    color: ${({ theme, expanded }) => (expanded ? theme.text3 : 'transparent')};
    @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
      color: transparent;
    }
  }
  ::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    height: 24px;
    width: 24px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2399A1BD' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='feather feather-x'%3E%3Cline x1='18' y1='6' x2='6' y2='18'%3E%3C/line%3E%3Cline x1='6' y1='6' x2='18' y2='18'%3E%3C/line%3E%3C/svg%3E");
    margin-right: 10px;
    background-size: 24px 24px;
  }
`
const IconContainer = styled.span`
  position: absolute;
  display: flex;
  align-items: center;
  left: 12px;
`

export default function SearchBar() {
  const theme = useTheme()
  const [isExpanded, setExpanded] = useState(false)
  const [searchContent, setSearchContent] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchContent(event.target.value)
  }

  return (
    <SearchBarWrapper>
      <SearchInput
        expanded={isExpanded}
        type="search"
        placeholder="Search token or paste address"
        id="searchBar"
        onFocus={() => setExpanded(true)}
        autoComplete="off"
        value={searchContent}
        onChange={handleSearchChange}
        ref={searchRef}
      />
    </SearchBarWrapper>
  )
}
