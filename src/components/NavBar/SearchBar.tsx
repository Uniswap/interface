// eslint-disable-next-line no-restricted-imports
import { t } from '@lingui/macro'
import { useLingui } from '@lingui/react'
import { BrowserEvent, InterfaceElementName, InterfaceEventName, InterfaceSectionName } from '@uniswap/analytics-events'
import { ChainId, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, Trace, TraceEvent, useTrace } from 'analytics'
import clsx from 'clsx'
import { ZERO_ADDRESS } from 'constants/misc'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { useCollectionSearch } from 'graphql/data/nft/CollectionSearch'
import { SearchToken, useSearchTokens } from 'graphql/data/SearchTokens'
import { chainIdToBackendName } from 'graphql/data/util'
import useDebounce from 'hooks/useDebounce'
import { useDisableNFTRoutes } from 'hooks/useDisableNFTRoutes'
import { useIsNftPage } from 'hooks/useIsNftPage'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { organizeSearchResults } from 'lib/utils/searchBar'
import { Box } from 'nft/components/Box'
import { Column, Row } from 'nft/components/Flex'
import { magicalGradientOnHover } from 'nft/css/common.css'
import { useIsMobile, useIsTablet } from 'nft/hooks'
import { useIsNavSearchInputVisible } from 'nft/hooks/useIsNavSearchInputVisible'
import { ChangeEvent, useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PoolRegisteredLog, usePoolsFromList, useRegisteredPools, useRegistryContract } from 'state/pool/hooks'
import styled from 'styled-components'

import { ChevronLeftIcon, MagnifyingGlassIcon, NavMagnifyingGlassIcon } from '../../nft/components/icons'
import { NavIcon } from './NavIcon'
import * as styles from './SearchBar.css'
import { SearchBarDropdown } from './SearchBarDropdown'

const KeyShortCut = styled.div`
  background-color: ${({ theme }) => theme.hoverState};
  color: ${({ theme }) => theme.textSecondary};
  padding: 0px 8px;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 800;
  line-height: 16px;
  display: flex;
  align-items: center;
  opacity: 0.6;
  backdrop-filter: blur(60px);
`

export const SearchBar = () => {
  const [isOpen, toggleOpen] = useReducer((state: boolean) => !state, false)
  const [searchValue, setSearchValue] = useState('')
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

  const { chainId } = useWeb3React()
  const { data: tokens, loading: tokensAreLoading } = useSearchTokens(debouncedSearchValue, chainId ?? 1)

  // TODO: check if we already store all pools' data in state, so can return a richer pool struct
  const smartPoolsLogs = useRegisteredPools()
  const registry = useRegistryContract()
  const poolsFromList = usePoolsFromList(registry, chainId)
  const allPools: PoolRegisteredLog[] = useMemo(() => {
    if (chainId === ChainId.BNB || chainId === ChainId.BASE || chainId === ChainId.OPTIMISM) {
      return [...(smartPoolsLogs ?? []), ...(poolsFromList ?? [])]
    }
    return [...(smartPoolsLogs ?? [])]
  }, [chainId, smartPoolsLogs, poolsFromList])

  const smartPools: Token[] = useMemo(() => {
    const mockToken = new Token(1, ZERO_ADDRESS, 0, '', '')
    if (!allPools || !chainId) return [mockToken]
    return allPools.map((p) => {
      const { name, symbol, pool: address } = p
      //if (!name || !symbol || !address) return
      return new Token(chainId ?? 1, address ?? undefined, 18, symbol ?? 'NAN', name ?? '')
    })
  }, [chainId, allPools])
  const filteredPools: Token[] = useMemo(() => {
    return Object.values(smartPools).filter(getTokenFilter(debouncedSearchValue))
  }, [smartPools, debouncedSearchValue])
  const chain = chainId ? chainIdToBackendName(chainId) : undefined
  // TODO: check using a different struct for pools
  const searchPools: SearchToken[] | undefined = useMemo(() => {
    if (!chain) return
    return filteredPools.map((p) => {
      const { name, symbol, address } = p
      return {
        id: '',
        name: name ?? '',
        address,
        symbol: symbol ?? '',
        decimals: 0,
        chain: chain ?? Chain.Ethereum,
        project: {
          logoUrl: '',
          id: '',
          safetyLevel: undefined,
        },
        market: {
          id: '',
          price: { id: '', value: 0, currency: undefined },
          pricePercentChange: { id: '', value: 0 },
          volume24H: { id: '', value: 0, currency: undefined },
        },
      }
    })
  }, [chain, filteredPools])

  const isNFTPage = useIsNftPage()

  const [reducedPools, reducedTokens, reducedCollections] = organizeSearchResults(
    isNFTPage,
    searchPools ?? [],
    tokens ?? [],
    collections ?? []
  )

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
    hasInput: debouncedSearchValue && debouncedSearchValue.length > 0,
    ...trace,
  }

  const { i18n } = useLingui() // subscribe to locale changes
  const placeholderText = isMobileOrTablet
    ? t(i18n)`Search`
    : shouldDisableNFTRoutes
    ? t(i18n)`Search smart pools`
    : t(i18n)`Search tokens and NFT collections`

  const handleKeyPress = useCallback(
    (event: any) => {
      if (event.key === '/') {
        event.preventDefault()
        !isOpen && toggleOpen()
      }
    },
    [isOpen]
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
        data-cy="search-bar"
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
      >
        <Row
          className={clsx(
            styles.nftSearchBar,
            !isOpen && !isMobile && magicalGradientOnHover,
            isMobileOrTablet && (isOpen ? styles.visible : styles.hidden)
          )}
          borderRadius={isOpen || isMobileOrTablet ? undefined : '12'}
          borderTopRightRadius={isOpen && !isMobile ? '12' : undefined}
          borderTopLeftRadius={isOpen && !isMobile ? '12' : undefined}
          borderBottomWidth={isOpen || isMobileOrTablet ? '0px' : '1px'}
          backgroundColor={isOpen ? 'backgroundSurface' : 'searchBackground'}
          onClick={() => !isOpen && toggleOpen()}
          gap="12"
        >
          <Box className={styles.searchContentLeftAlign}>
            <Box display={{ sm: 'none', md: 'flex' }}>
              <MagnifyingGlassIcon />
            </Box>
            <Box display={{ sm: 'flex', md: 'none' }} color="textTertiary" onClick={toggleOpen}>
              <ChevronLeftIcon />
            </Box>
          </Box>
          <TraceEvent
            events={[BrowserEvent.onFocus]}
            name={InterfaceEventName.NAVBAR_SEARCH_SELECTED}
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
          </TraceEvent>
          {!isOpen && <KeyShortCut>/</KeyShortCut>}
        </Row>
        <Column overflow="hidden" className={clsx(isOpen ? styles.visible : styles.hidden)}>
          {isOpen && (
            <SearchBarDropdown
              toggleOpen={toggleOpen}
              pools={reducedPools}
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
