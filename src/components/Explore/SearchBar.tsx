import { useAtom } from 'jotai'
import styled from 'styled-components/macro'

import searchIcon from './search.svg'
import { filterStringAtom } from './state'
import xIcon from './x.svg'

export const SMALL_MEDIA_BREAKPOINT = '580px'
const ICON_SIZE = '20px'

const SearchBarContainer = styled.div`
  display: flex;
  flex: 1;
`

const SearchInput = styled.input`
  background: no-repeat scroll 7px 7px;
  background-image: url(${searchIcon});
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.bg0};
  left: 10px;
  border-radius: 12px;
  border: none;
  height: 100%;
  width: 44px;
  font-size: 16px;
  padding-left: 40px;
  color: ${({ theme }) => theme.text2};
  transition: width 0.75s cubic-bezier(0, 0.795, 0, 1);

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.bg2};
    width: 100%;
  }
  ::placeholder {
    color: none;
    @media only screen and (max-width: ${SMALL_MEDIA_BREAKPOINT}) {
      color: transparent;
    }
    :focus {
      color: ${({ theme }) => theme.text3};
    }
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
`

export default function SearchBar() {
  const [filterString, setFilterString] = useAtom(filterStringAtom)

  return (
    <SearchBarContainer>
      <SearchInput
        type="search"
        placeholder="Search token or paste address"
        id="searchBar"
        onBlur={() => filterString.length === 0}
        autoComplete="off"
        value={filterString}
        onChange={({ target: { value } }) => setFilterString(value)}
      />
    </SearchBarContainer>
  )
}
