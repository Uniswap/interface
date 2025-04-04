import { InterfaceElementName, InterfaceEventName } from '@uniswap/analytics-events'
import { ReactComponent as SearchIcon } from 'assets/svg/search.svg'
import xIcon from 'assets/svg/x.svg'
import { MEDIUM_MEDIA_BREAKPOINT } from 'components/Tokens/constants'
import { exploreSearchStringAtom } from 'components/Tokens/state'
import useDebounce from 'hooks/useDebounce'
import { useAtomValue, useUpdateAtom } from 'jotai/utils'
import styled from 'lib/styled-components'
import { ExploreTab } from 'pages/Explore'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, useSporeColors } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'

const ICON_SIZE = '20px'

const SearchInput = styled.input<{ isOpen?: boolean }>`
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

  @supports (-webkit-touch-callout: none) {
    @media screen and (max-width: ${breakpoints.md}px) {
      min-width: 44px;
      padding-left: ${({ isOpen }) => (isOpen ? '40px' : '36px')};
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

  @media only screen and (max-width: ${MEDIUM_MEDIA_BREAKPOINT}) {
    width: ${({ isOpen }) => (isOpen ? 'min(100%, 200px)' : '0')};
  }
`

export default function SearchBar({ tab }: { tab?: string }) {
  const { t } = useTranslation()
  const currentString = useAtomValue(exploreSearchStringAtom)
  const [localFilterString, setLocalFilterString] = useState(currentString)
  const setFilterString = useUpdateAtom(exploreSearchStringAtom)
  const debouncedLocalFilterString = useDebounce(localFilterString, 300)
  const [isOpen, setIsOpen] = useState(false)
  const colors = useSporeColors()

  useEffect(() => {
    setLocalFilterString(currentString)
    if (currentString) {
      setIsOpen(true)
    }
  }, [currentString])

  useEffect(() => {
    setFilterString(debouncedLocalFilterString)
  }, [debouncedLocalFilterString, setFilterString])

  const handleFocus = () => setIsOpen(true)

  const handleBlur = () => {
    if (localFilterString === '') {
      setIsOpen(false)
    }
  }

  const placeholdersText: Record<string, string> = {
    [ExploreTab.Tokens]: t('tokens.table.search.placeholder.tokens'),
    [ExploreTab.Pools]: t('tokens.table.search.placeholder.pools'),
    [ExploreTab.Transactions]: t('tokens.table.search.placeholder.transactions'),
  }

  return (
    <Trace
      logFocus
      eventOnTrigger={InterfaceEventName.EXPLORE_SEARCH_SELECTED}
      element={InterfaceElementName.EXPLORE_SEARCH_INPUT}
    >
      <Flex centered flex={1}>
        <SearchIcon
          fill={colors.neutral1.val}
          style={{ position: 'absolute', left: '12px' }}
          width={ICON_SIZE}
          height={ICON_SIZE}
          pointerEvents="none"
        />
        <SearchInput
          data-testid="explore-tokens-search-input"
          type="search"
          placeholder={placeholdersText[tab ?? ExploreTab.Tokens]}
          id="searchBar"
          autoComplete="off"
          value={localFilterString}
          onChange={({ target: { value } }) => setLocalFilterString(value)}
          isOpen={isOpen}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </Flex>
    </Trace>
  )
}
