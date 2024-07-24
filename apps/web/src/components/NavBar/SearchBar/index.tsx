// eslint-disable-next-line no-restricted-imports
import { InterfaceElementName, InterfaceEventName, InterfaceSectionName } from '@uniswap/analytics-events'
import { NavIcon } from 'components/NavBar/NavIcon'
import { NAV_BREAKPOINT } from 'components/NavBar/ScreenSizes'
import { SearchBarDropdown } from 'components/NavBar/SearchBar/SearchBarDropdown'
import Row from 'components/Row'
import { useSearchTokens } from 'graphql/data/SearchTokens'
import { useCollectionSearch } from 'graphql/data/nft/CollectionSearch'
import { useScreenSize } from 'hooks/screenSize'
import { useAccount } from 'hooks/useAccount'
import useDebounce from 'hooks/useDebounce'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { KeyAction, useKeyPress } from 'hooks/useKeyPress'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useTranslation } from 'i18n/useTranslation'
import styled, { css, useTheme } from 'lib/styled-components'
import { organizeSearchResults } from 'lib/utils/searchBar'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Search, X } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { BREAKPOINTS } from 'theme'
import { Z_INDEX } from 'theme/zIndex'
import { Input } from 'ui/src'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const NAV_SEARCH_MAX_WIDTH = '400px'
const NAV_SEARCH_MIN_WIDTH = '280px'

const Anchor = styled.div<{ $fullScreen: boolean }>`
  position: ${({ $fullScreen }) => ($fullScreen ? 'static' : 'relative')};
  ${({ $fullScreen }) => $fullScreen && `z-index: ${Z_INDEX.modal}`}
`
const FullScreenSearchContainer = css`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  max-height: none;
  z-index: ${Z_INDEX.modal};
`
const CollapsedSearchContainer = css`
  position: absolute;
  top: 0;
  right: 0;
`
const SearchContainer = styled.div<{
  $isOpen: boolean
  $collapsed: boolean
  $maxHeight?: string
  $isDropdown: boolean
  $fullScreen: boolean
}>`
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas: 'input' 'dropdown';
  max-height: ${({ $maxHeight }) => $maxHeight || '100vh'};
  z-index: ${Z_INDEX.dropdown};

  ${({ $isOpen, $collapsed, $fullScreen }) => {
    if ($fullScreen && $isOpen) {
      return FullScreenSearchContainer
    }
    return $collapsed && CollapsedSearchContainer
  }}
`
const KeyShortcut = styled.div`
  background-color: ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral2};
  padding: 0px 8px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 535;
  line-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  backdrop-filter: blur(60px);
`
const OpenSearchInput = css`
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: 1px solid transparent;
`
const FullScreenSearchInput = css`
  max-width: none;
  border: none;
  border-radius: 0;
  gap: 8px;
  height: 64px;
`
const ClosedSearchInputHover = css`
  &:hover {
    background-color: ${({ theme }) => theme.surface1Hovered};
  }
`
const SearchInput = styled(Row)<{ $isOpen: boolean; $fullScreen: boolean }>`
  grid-area: input;
  background-color: ${({ theme, $isOpen }) => ($isOpen ? theme.surface1 : theme.surface2)};
  border: 1px solid ${({ theme }) => theme.surface3};
  min-width: ${NAV_SEARCH_MIN_WIDTH};
  max-width: ${NAV_SEARCH_MAX_WIDTH};
  width: 100vw;
  padding: 8px 16px;
  border-radius: 20px;
  height: 40px;
  justify-content: center;
  align-items: center;
  gap: 4px;
  ${({ $isOpen }) => $isOpen && OpenSearchInput}
  ${({ $fullScreen }) => $fullScreen && FullScreenSearchInput}
  ${({ $isOpen }) => !$isOpen && ClosedSearchInputHover}

  @media screen and (max-width: ${BREAKPOINTS.xs}px) {
    border: none;
  }
`
const OpenSearchDropdown = css`
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top-width: 0;
`
const FullScreenSearchDropdown = css`
  border: none;
  border-radius: 0;
`
const SearchBarDropdownContainer = styled.div<{ $isOpen: boolean; $fullScreen: boolean }>`
  grid-area: dropdown;
  background-color: ${({ theme }) => theme.surface1};
  border: 1px solid ${({ theme }) => theme.surface3};
  border-radius: 20px;
  max-height: 100%;
  overflow-y: scroll;
  ${({ $isOpen }) => $isOpen && OpenSearchDropdown}
  ${({ $fullScreen }) => $fullScreen && FullScreenSearchDropdown}
  @media screen and (max-width: ${NAV_BREAKPOINT.isMobileDrawer}px) {
    border: none;
  }
`
const CloseIcon = styled(X)`
  width: 25px;
  height: 25px;
  stroke: ${({ theme }) => theme.neutral2};
  cursor: pointer;
`
const SearchIcon = styled.div`
  width: 20px;
  height: 20px;
`

export const SearchBar = ({
  maxHeight,
  isDropdown = true,
  fullScreen = false,
}: {
  maxHeight?: string
  isDropdown?: boolean
  fullScreen?: boolean
}) => {
  const [isOpen, setOpen] = useState<boolean>(false)
  const [searchValue, setSearchValue] = useState<string>('')
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<any>(null)
  const { pathname } = useLocation()
  const isNavSearchInputVisible = useScreenSize()['lg']
  const shouldDisableNFTRoutes = useDisableNFTRoutes()
  const theme = useTheme()
  const { t } = useTranslation() // subscribe to locale changes

  const toggleOpen = useCallback(() => {
    setOpen(!isOpen)
    if (fullScreen) {
      // disable body scroll on fullScreen search (was triggering the animation to hide the nav and affecting the search modal. Alternative option would be to create a separate search modal that is not a child of the nav component)
      document.body.style.overflow = !isOpen ? 'hidden' : 'scroll'
    }
  }, [setOpen, isOpen, fullScreen])

  useOnClickOutside(searchRef, () => isOpen && toggleOpen())

  useKeyPress({
    callback: toggleOpen,
    keys: ['/'],
    disabled: isOpen,
    preventDefault: !isOpen,
  })
  useKeyPress({
    callback: toggleOpen,
    keys: ['Escape'],
    keyAction: KeyAction.UP,
    disabled: !isOpen,
  })

  const { data: collections, loading: collectionsAreLoading } = useCollectionSearch(debouncedSearchValue)

  const account = useAccount()
  const { data: tokens, loading: tokensAreLoading } = useSearchTokens(debouncedSearchValue, account.chainId ?? 1)
  const isNFTPage = useIsNftPage()
  const [reducedTokens, reducedCollections] = organizeSearchResults(isNFTPage, tokens ?? [], collections ?? [])

  // clear searchbar when changing pages
  useEffect(() => {
    setSearchValue('')
  }, [pathname])

  // auto set cursor when searchbar is opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const trace = useTrace({ section: InterfaceSectionName.NAVBAR_SEARCH })

  const navbarSearchEventProperties = {
    navbar_search_input_text: debouncedSearchValue,
    hasInput: debouncedSearchValue.length > 0,
    ...trace,
  }

  const placeholderText = shouldDisableNFTRoutes ? t('common.searchTokens') : t('common.searchTokensNFT')

  return (
    <Trace section={InterfaceSectionName.NAVBAR_SEARCH}>
      <Anchor $fullScreen={fullScreen}>
        <SearchContainer
          ref={searchRef}
          $isOpen={isOpen}
          $collapsed={!isNavSearchInputVisible}
          $maxHeight={maxHeight}
          $isDropdown={isDropdown}
          $fullScreen={fullScreen}
        >
          {(!!isNavSearchInputVisible || isOpen) && (
            <SearchInput $isOpen={isOpen} $fullScreen={fullScreen}>
              <SearchIcon>
                <Search width="20px" height="20px" color={theme.neutral2} />
              </SearchIcon>
              <Trace
                logFocus
                eventOnTrigger={InterfaceEventName.NAVBAR_SEARCH_SELECTED}
                element={InterfaceElementName.NAVBAR_SEARCH_INPUT}
                properties={{ ...trace }}
              >
                <Input
                  ref={inputRef}
                  data-cy="search-bar-input"
                  width="100%"
                  height="100%"
                  backgroundColor="$transparent"
                  placeholder={placeholderText}
                  placeholderTextColor={theme.neutral2}
                  onFocus={() => !isOpen && toggleOpen()}
                  onChange={(event: any) => {
                    !isOpen && toggleOpen()
                    setSearchValue(event.target.value)
                  }}
                  onBlur={() =>
                    sendAnalyticsEvent(InterfaceEventName.NAVBAR_SEARCH_EXITED, navbarSearchEventProperties)
                  }
                  value={searchValue}
                />
              </Trace>
              {fullScreen && isOpen && <CloseIcon onClick={toggleOpen} />}
              {!isOpen && <KeyShortcut>/</KeyShortcut>}
            </SearchInput>
          )}
          {isOpen && (
            <SearchBarDropdownContainer $isOpen={isOpen} $fullScreen={fullScreen}>
              <SearchBarDropdown
                toggleOpen={toggleOpen}
                tokens={reducedTokens}
                collections={reducedCollections}
                queryText={debouncedSearchValue}
                hasInput={debouncedSearchValue.length > 0}
                isLoading={tokensAreLoading || collectionsAreLoading}
              />
            </SearchBarDropdownContainer>
          )}
        </SearchContainer>
        {!isNavSearchInputVisible && (
          <NavIcon onClick={toggleOpen} label={placeholderText}>
            <SearchIcon>
              <Search width="20px" height="20px" color={theme.neutral2} />
            </SearchIcon>
          </NavIcon>
        )}
      </Anchor>
    </Trace>
  )
}
