import { Trans } from '@lingui/macro'
import searchIcon from 'assets/svg/search.svg'
import xIcon from 'assets/svg/x.svg'
import { MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import useDebounce from 'hooks/useDebounce'
import { useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import styled from 'styled-components/macro'

import { filterFarmStringAtom } from './utils'

// import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
// import { filterStringAtom } from '../state'
const ICON_SIZE = '20px'

const SearchBarContainer = styled.div`
  display: flex;
  flex: 1;
  height: 40px;
`
const SearchInput = styled.input`
  background: no-repeat scroll 7px 7px;
  background-image: url(${searchIcon});
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.backgroundSurface};
  border-radius: 12px;
  border: 1.5px solid transparent;
  height: 100%;
  width: min(200px, 100%);
  font-size: 14px;
  padding-left: 40px;
  color: ${({ theme }) => theme.accentActive};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};

  :hover {
    background-color: ${({ theme }) => theme.accentActiveSoft};
  }

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.accentActiveSoft};
  }

  ::placeholder {
    color: ${({ theme }) => theme.textTertiary};
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

// eslint-disable-next-line import/no-unused-modules
export default function SearchBar() {
  const currentString = useAtomValue(filterFarmStringAtom)
  const [localFilterString, setLocalFilterString] = useState(currentString)
  const setFilterString = useSetAtom(filterFarmStringAtom)
  const debouncedLocalFilterString = useDebounce(localFilterString, 300)

  useEffect(() => {
    setLocalFilterString(currentString)
  }, [currentString])

  useEffect(() => {
    setFilterString(debouncedLocalFilterString)
  }, [debouncedLocalFilterString, setFilterString])

  return (
    <SearchBarContainer>
      <Trans
        render={({ translation }) => (
          <SearchInput
            data-cy="explore-tokens-search-input"
            type="search"
            // eslint-disable-next-line react/jsx-curly-brace-presence
            placeholder={`${translation}`}
            id="searchBar"
            autoComplete="off"
            value={localFilterString}
            onChange={({ target: { value } }) => setLocalFilterString(value)}
          />
        )}
      >
        Search Farms
      </Trans>
    </SearchBarContainer>
  )
}
