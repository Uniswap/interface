import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { TraceEvent } from 'analytics'
import searchIcon from 'assets/svg/search.svg'
import xIcon from 'assets/svg/x.svg'
import { useInfoExplorePageEnabled } from 'featureFlags/flags/infoExplore'
import useDebounce from 'hooks/useDebounce'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { MEDIUM_MEDIA_BREAKPOINT } from '../constants'
import { filterStringAtom } from '../state'
const ICON_SIZE = '20px'

const SearchBarContainer = styled.div<{ isInfoExplorePageEnabled: boolean }>`
  display: flex;
  flex: 1;
  ${({ isInfoExplorePageEnabled }) => isInfoExplorePageEnabled && 'justify-content: flex-end;'}
`
const SearchInput = styled.input<{ isInfoExplorePageEnabled: boolean; isOpen?: boolean }>`
  background: no-repeat scroll 7px 7px;
  background-image: url(${searchIcon});
  background-size: 20px 20px;
  background-position: 12px center;
  background-color: ${({ theme }) => theme.surface1};
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.surface3};
  height: 100%;
  width: ${({ isInfoExplorePageEnabled, isOpen }) =>
    isInfoExplorePageEnabled ? (isOpen ? '200px' : '0') : 'min(200px, 100%)'};
  font-size: 16px;
  font-weight: 485;
  padding-left: 40px;
  color: ${({ theme }) => theme.neutral2};
  transition-duration: ${({ theme }) => theme.transition.duration.fast};
  ${(isInfoExplorePageEnabled) => isInfoExplorePageEnabled && 'text-overflow: ellipsis;'}

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
    width: ${({ isInfoExplorePageEnabled, isOpen }) =>
      isInfoExplorePageEnabled ? (isOpen ? 'min(100%, 200px)' : '0') : '100%'};
  }
`

export default function SearchBar({ tab }: { tab?: string }) {
  const currentString = useAtomValue(filterStringAtom)
  const [localFilterString, setLocalFilterString] = useState(currentString)
  const setFilterString = useUpdateAtom(filterStringAtom)
  const debouncedLocalFilterString = useDebounce(localFilterString, 300)
  const isInfoExplorePageEnabled = useInfoExplorePageEnabled()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLocalFilterString(currentString)
  }, [currentString])

  useEffect(() => {
    setFilterString(debouncedLocalFilterString)
  }, [debouncedLocalFilterString, setFilterString])

  const handleFocus = () => setIsOpen(true)

  const handleBlur = () => {
    if (localFilterString === '') setIsOpen(false)
  }

  return (
    <SearchBarContainer isInfoExplorePageEnabled={isInfoExplorePageEnabled}>
      <Trans
        render={({ translation }) => (
          <TraceEvent
            events={[BrowserEvent.onFocus]}
            name={InterfaceEventName.EXPLORE_SEARCH_SELECTED}
            element={InterfaceElementName.EXPLORE_SEARCH_INPUT}
          >
            <SearchInput
              isInfoExplorePageEnabled={isInfoExplorePageEnabled}
              data-cy="explore-tokens-search-input"
              type="search"
              placeholder={`${translation}`}
              id="searchBar"
              autoComplete="off"
              value={localFilterString}
              onChange={({ target: { value } }) => setLocalFilterString(value)}
              isOpen={isOpen}
              onFocus={isInfoExplorePageEnabled ? handleFocus : undefined}
              onBlur={isInfoExplorePageEnabled ? handleBlur : undefined}
            />
          </TraceEvent>
        )}
      >
        {isInfoExplorePageEnabled ? (tab === 'tokens' ? 'Search tokens' : 'Search pools') : 'Filter tokens'}
      </Trans>
    </SearchBarContainer>
  )
}
