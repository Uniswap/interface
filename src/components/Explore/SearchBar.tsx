import { useAtom } from 'jotai'
import { useState } from 'react'
import styled from 'styled-components/macro'

import { MEDIUM_MEDIA_BREAKPOINT } from './constants'
import searchIcon from './search.svg'
import { filterStringAtom } from './state'
import xIcon from './x.svg'
const ICON_SIZE = '20px'

const SearchBarContainer = styled.div`
  display: flex;
  flex: 1;
`

const SearchInput = styled.input<{ expanded: boolean }>`
  background: no-repeat scroll 7px 7px;
  background-image: url(${searchIcon});
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.deprecated_bg0};
  left: 10px;
  border-radius: 12px;
  border: none;
  height: 100%;
  width: ${({ expanded }) => (expanded ? '100%' : '44px')};
  font-size: 16px;
  padding-left: 40px;
  color: ${({ theme }) => theme.deprecated_text2};
  transition: width 0.75s cubic-bezier(0, 0.795, 0, 1);

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.deprecated_bg2};
  }
  ::placeholder {
    color: ${({ expanded, theme }) => expanded && theme.deprecated_text3};
  }
  ::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    height: ${ICON_SIZE};
    width: ${ICON_SIZE};
    background-image: url(${xIcon});
    margin-right: 10px;
    background-size: ${ICON_SIZE} ${ICON_SIZE};
    cursor: pointer;
  }

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    width: 100%;
  }
`

export default function SearchBar() {
  const [filterString, setFilterString] = useAtom(filterStringAtom)
  const [isExpanded, setExpanded] = useState(filterString.length !== 0)

  return (
    <SearchBarContainer>
      <SearchInput
        expanded={isExpanded}
        type="search"
        placeholder="Search by name or token address"
        id="searchBar"
        onBlur={() => isExpanded && filterString.length === 0 && setExpanded(false)}
        onFocus={() => setExpanded(true)}
        autoComplete="off"
        value={filterString}
        onChange={({ target: { value } }) => setFilterString(value)}
      />
    </SearchBarContainer>
  )
}
