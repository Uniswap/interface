// eslint-disable-next-line no-restricted-imports
import { InterfaceElementName, InterfaceEventName, InterfaceSectionName } from '@uniswap/analytics-events'
import clsx from 'clsx'
import { Search } from 'components/Icons/Search'
import * as styles from 'components/NavBar/LEGACY/SearchBar/SearchBar.css'
import { SearchBarDropdown } from 'components/NavBar/LEGACY/SearchBar/SearchBarDropdown'
import { NavIcon } from 'components/NavBar/NavIcon'
import { useSearchTokens } from 'graphql/data/SearchTokens'
import { useCollectionSearch } from 'graphql/data/nft/CollectionSearch'
import { useIsMobile, useIsTablet } from 'hooks/screenSize'
import { useAccount } from 'hooks/useAccount'
import useDebounce from 'hooks/useDebounce'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { useTranslation } from 'i18n/useTranslation'
import styled from 'lib/styled-components'
import { organizeSearchResults } from 'lib/utils/searchBar'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { ChevronLeftIcon, NavMagnifyingGlassIcon } from 'nft/components/icons'
import { magicalGradientOnHover } from 'nft/css/common.css'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { ChangeEvent, useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

const KeyShortcut = styled.div`
  background-color: ${({ theme }) => theme.surface3};
  color: ${({ theme }) => theme.neutral2};
  padding: 0px 8px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 535;
  line-height: 18px;
  display: flex;
  align-items: center;
  opacity: 0.6;
  backdrop-filter: blur(60px);
`

export function SearchBar() {
  const [isOpen, toggleOpen] = useReducer((state: boolean) => !state, false)
  const [searchValue, setSearchValue] = useState<string>('')
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isNavSearchInputVisible = useIsNavSearchInputVisible()
  const shouldDisableNFTRoutes = useDisableNFTRoutes()

  useOnClickOutside(searchRef, () => {
    isOpen && toggleOpen()
  })

  const { data: collections, loading: collectionsAreLoading } = useCollectionSearch(debouncedSearchValue)

  const account = useAccount()
  const { data: tokens, loading: tokensAreLoading } = useSearchTokens(debouncedSearchValue, account.chainId ?? 1)

  const isNFTPage = useIsNftPage()

  const [reducedTokens, reducedCollections] = organizeSearchResults(isNFTPage, tokens ?? [], collections ?? [])

  // close dropdown on escape
  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        event.preventDefault()
        toggleOpen()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [isOpen, toggleOpen, collections])

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

  const isMobileOrTablet = isMobile || isTablet || !isNavSearchInputVisible

  const trace = useTrace({ section: InterfaceSectionName.NAVBAR_SEARCH })

  const navbarSearchEventProperties = {
    navbar_search_input_text: debouncedSearchValue,
    hasInput: debouncedSearchValue.length > 0,
    ...trace,
  }

  const { t } = useTranslation() // subscribe to locale changes
  const placeholderText = isMobileOrTablet
    ? t('common.search.label')
    : shouldDisableNFTRoutes
      ? t('common.searchTokens')
      : t('common.searchTokensNFT')

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      const isInputEvent = event.target && (event.target as HTMLInputElement).tagName === 'INPUT'
      if (event.key === '/' && !isInputEvent) {
        event.preventDefault()
        !isOpen && toggleOpen()
      }
    },
    [isOpen],
  )

  useEffect(() => {
    const innerRef = inputRef.current

    if (innerRef !== null) {
      //only mount the listener when input available as ref
      document.addEventListener('keydown', handleKeyPress)
    }

    return () => {
      if (innerRef !== null) {
        document.removeEventListener('keydown', handleKeyPress)
      }
    }
  }, [handleKeyPress, inputRef])

  return (
    <Trace section={InterfaceSectionName.NAVBAR_SEARCH}>
      <Column
        position={{ sm: 'fixed', md: 'absolute' }}
        width={{ sm: isOpen ? 'viewWidth' : 'auto', md: 'auto' }}
        ref={searchRef}
        className={clsx(styles.searchBarContainerNft, {
          searchBarContainerDisableBlur: isNavSearchInputVisible,
        })}
        display={{ sm: isOpen ? 'flex' : 'none', xl: 'flex' }}
        {...(isNavSearchInputVisible && {
          position: 'relative',
          display: 'flex',
        })}
        {...(isOpen && {
          boxShadow: 'deep',
        })}
      >
        <Row
          className={clsx(
            styles.nftSearchBar,
            !isOpen && !isMobile && magicalGradientOnHover,
            isMobileOrTablet && (isOpen ? styles.visible : styles.hidden),
          )}
          borderRadius={isOpen || isMobileOrTablet ? undefined : '16'}
          borderTopRightRadius={isOpen && !isMobile ? '16' : undefined}
          borderTopLeftRadius={isOpen && !isMobile ? '16' : undefined}
          borderBottomWidth={isOpen || isMobileOrTablet ? '0px' : '1px'}
          backgroundColor={isOpen ? 'surface1' : 'surface1'}
          onClick={() => !isOpen && toggleOpen()}
          gap="12"
        >
          <Box className={styles.searchContentLeftAlign}>
            <Box display={{ sm: 'none', md: 'flex' }}>
              <Search width="20px" height="20px" />
            </Box>
            <Box display={{ sm: 'flex', md: 'none' }} color="neutral3" onClick={toggleOpen}>
              <ChevronLeftIcon />
            </Box>
          </Box>
          <Trace
            logFocus
            eventOnTrigger={InterfaceEventName.NAVBAR_SEARCH_SELECTED}
            element={InterfaceElementName.NAVBAR_SEARCH_INPUT}
            properties={{ ...trace }}
          >
            <Box
              as="input"
              data-cy="search-bar-input"
              placeholder={placeholderText}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                !isOpen && toggleOpen()
                setSearchValue(event.target.value)
              }}
              onBlur={() => sendAnalyticsEvent(InterfaceEventName.NAVBAR_SEARCH_EXITED, navbarSearchEventProperties)}
              className={`${styles.searchBarInput} ${styles.searchContentLeftAlign}`}
              value={searchValue}
              ref={inputRef}
              width="full"
            />
          </Trace>
          {!isOpen && <KeyShortcut>/</KeyShortcut>}
        </Row>
        <Column overflow="hidden" className={clsx(isOpen ? styles.visible : styles.hidden)}>
          {isOpen && (
            <SearchBarDropdown
              toggleOpen={toggleOpen}
              tokens={reducedTokens}
              collections={reducedCollections}
              queryText={debouncedSearchValue}
              hasInput={debouncedSearchValue.length > 0}
              isLoading={tokensAreLoading || collectionsAreLoading}
            />
          )}
        </Column>
      </Column>
      {isMobileOrTablet && (
        <NavIcon onClick={toggleOpen} label={placeholderText}>
          <NavMagnifyingGlassIcon />
        </NavIcon>
      )}
    </Trace>
  )
}
