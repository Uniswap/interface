import searchIcon from 'assets/svg/search.svg'
import xIcon from 'assets/svg/x.svg'
import { useAtom } from 'jotai'
import { useState } from 'react'
import styled from 'styled-components/macro'

import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { filterStringAtom } from '../state'
const ICON_SIZE = '20px'

const SearchBarContainer = styled.div`
  display: flex;
  flex: 1;
`
const SearchInput = styled.input<{ expanded: boolean }>`
  background: no-repeat scroll 7px 7px;
  background-image: ${({ expanded }) => !expanded && `url(${searchIcon})`};
  background-size: 20px 20px;
  background-position: 14px center;
  background-color: 'transparent';
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  height: 100%;
  width: ${({ expanded }) => (expanded ? '100%' : '52px')};
  font-size: 16px;
  padding-left: 35px;
  color: ${({ theme }) => theme.textPrimary};
  transition: width 0.75s cubic-bezier(0, 0.795, 0, 1);

  :hover {
    cursor: ${({ expanded }) => !expanded && 'pointer'};
    background-color: ${({ theme }) => theme.backgroundModule};
  }

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.accentActionSoft};
    border: none;
  }
  ::placeholder {
    color: ${({ expanded, theme }) => (expanded ? theme.textTertiary : 'transparent')};
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
  const [isExpanded, setExpanded] = useState(false)
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
