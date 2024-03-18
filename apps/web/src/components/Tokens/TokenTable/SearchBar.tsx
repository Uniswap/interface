import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import searchIcon from 'assets/svg/search.svg'
import xIcon from 'assets/svg/x.svg'
import useDebounce from 'hooks/useDebounce'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { exploreSearchStringAtom } from '../state'
const ICON_SIZE = '20px'

const SearchBarContainer = styled.div`
  display: flex;
  flex: 1;
`
const SearchInput = styled.input<{ isOpen?: boolean }>`
  background: no-repeat scroll 7px 7px;
  background-image: url(${searchIcon});
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  height: 100%;
  width: ${({ isOpen }) => (isOpen ? '200px' : '0')};
  font-size: 16px;
  font-weight: 485;
  padding-left: 40px;
  color: ${({ theme }) => theme.neutral2};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  text-overflow: ellipsis;

  :hover {
    background-color: ${({ theme }) => theme.surface1};
  }

  :focus {
    outline: none;
    background-color: ${({ theme }) => theme.surface1};
    border-color: ${({ theme }) => theme.accent1};
    color: ${({ theme }) => theme.neutral1};
  }

  ::placeholder {
    color: ${({ theme }) => theme.neutral3};
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
    width: ${({ isOpen }) => (isOpen ? 'min(100%, 200px)' : '0')};
  }
`

export default function SearchBar({ tab }: { tab?: string }) {
  const currentString = useAtomValue(exploreSearchStringAtom)
  const [localFilterString, setLocalFilterString] = useState(currentString)
  const setFilterString = useUpdateAtom(exploreSearchStringAtom)
  const debouncedLocalFilterString = useDebounce(localFilterString, 300)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLocalFilterString(currentString)
    if (currentString) setIsOpen(true)
  }, [currentString])

  useEffect(() => {
    setFilterString(debouncedLocalFilterString)
  }, [debouncedLocalFilterString, setFilterString])

  const handleFocus = () => setIsOpen(true)

  const handleBlur = () => {
    if (localFilterString === '') setIsOpen(false)
  }

  return (
    <SearchBarContainer>
      <Trans
        render={({ translation }) => (
          <TraceEvent
            events={[BrowserEvent.onFocus]}
            name={InterfaceEventName.EXPLORE_SEARCH_SELECTED}
            element={InterfaceElementName.EXPLORE_SEARCH_INPUT}
          >
            <SearchInput
              data-testid="explore-tokens-search-input"
              type="search"
              placeholder={`${translation}`}
              id="searchBar"
              autoComplete="off"
              value={localFilterString}
              onChange={({ target: { value } }) => setLocalFilterString(value)}
              isOpen={isOpen}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </TraceEvent>
        )}
      >
        {tab === 'tokens' ? 'Search tokens' : 'Search pools'}
      </Trans>
    </SearchBarContainer>
  )
}
