import useTheme from 'hooks/useTheme'
import { useRef, useState } from 'react'
// import { Search } from 'react-feather'
import styled from 'styled-components/macro'

export const SMALL_MEDIA_BREAKPOINT = '580px'

const SearchBarWrapper = styled.div`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
`

const SearchInput = styled.input<{ expanded: boolean }>`
  background: no-repeat scroll 7px 7px;
  background-image: url(components/Explore/resources/search.svg);
  background-size: 20px 20px;
  background-color: ${({ theme }) => theme.bg0};
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
  /*
        <IconContainer>
        <Search size={20} color={theme.text3} />
      </IconContainer>
      <IconContainer>
        <X
          size={20}
          color={theme.text3}
          onClick={() => setSearchContent('')}
          display={searchContent.length === 0 ? 'none' : 'show'}
        />
      </IconContainer>

        ::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    height: 24px;
    width: 24px;
    background-image: url(components/Explore/resources/x.svg);
    margin-right: 10px;
    background-size: 24px 24px;
  }
  */
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
