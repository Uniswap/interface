import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import { Edit } from 'react-feather'
import { FixedSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import AutoSizer from 'react-virtualized-auto-sizer'
import { t, Trans } from '@lingui/macro'
import { Currency, Token, ChainId } from '@kyberswap/ks-sdk-core'

import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useDebounce from 'hooks/useDebounce'
import { nativeOnChain } from 'constants/tokens'
import InfoHelper from 'components/InfoHelper'
import { useUserFavoriteTokens } from 'state/user/hooks'
import {
  useAllTokens,
  useToken,
  useIsUserAddedToken,
  useIsTokenActive,
  useSearchInactiveTokenLists,
} from 'hooks/Tokens'

import ImportRow from './ImportRow'
import { useActiveWeb3React } from '../../hooks'
import { CloseIcon, TYPE, ButtonText, IconWrapper } from '../../theme'
import { isAddress } from '../../utils'
import Row, { RowBetween, RowFixed } from '../Row'
import Column from '../Column'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { filterTokens } from 'utils/filtering'
import SortButton from './SortButton'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'

enum Tab {
  All,
  Favorites,
}

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
`

const Footer = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 20px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  background-color: ${({ theme }) => theme.background};
`

const TabButton = styled(ButtonText)`
  height: 32px;
  color: ${({ theme }) => theme.text};
  &[data-active='true'] {
    color: ${({ theme }) => theme.primary};
  }

  :focus {
    text-decoration: none;
  }
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showManageView: () => void
  showImportView: () => void
  setImportToken: (token: Token) => void
  customChainId?: ChainId
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  onDismiss,
  isOpen,
  showManageView,
  showImportView,
  setImportToken,
  customChainId,
}: CurrencySearchProps) {
  const { chainId: web3ChainId } = useActiveWeb3React()
  const chainId = customChainId || web3ChainId
  const theme = useTheme()
  const [activeTab, setActiveTab] = useState<Tab>(Tab.All)

  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const { favoriteTokens } = useUserFavoriteTokens(chainId)

  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)
  const allTokens = useAllTokens()

  // if they input an address, use it
  const isAddressSearch = isAddress(searchQuery)
  const searchToken = useToken(searchQuery)

  const searchTokenIsAdded = useIsUserAddedToken(searchToken)
  const isSearchTokenActive = useIsTokenActive(searchToken?.wrapped)

  const nativeToken = chainId && nativeOnChain(chainId)

  const showETH: boolean = useMemo(() => {
    const s = searchQuery.toLowerCase().trim()
    return !!nativeToken?.symbol?.toLowerCase().startsWith(s)
  }, [searchQuery, nativeToken])

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const filteredTokens: Token[] = useMemo(() => {
    if (isAddressSearch) return searchToken ? [searchToken.wrapped] : []
    return filterTokens(Object.values(allTokens), searchQuery)
  }, [isAddressSearch, searchToken, allTokens, searchQuery])

  const filteredSortedTokens: Token[] = useMemo(() => {
    if (searchToken) return [searchToken.wrapped]
    const sorted = filteredTokens.sort(tokenComparator)
    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)
    if (symbolMatch.length > 1) return sorted

    return [
      ...(searchToken ? [searchToken] : []),
      // sort any exact symbol matches first
      ...sorted.filter(token => token.symbol?.toLowerCase() === symbolMatch[0]),
      ...sorted.filter(token => token.symbol?.toLowerCase() !== symbolMatch[0]),
    ]
  }, [filteredTokens, searchQuery, searchToken, tokenComparator])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect],
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback(event => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = searchQuery.toLowerCase().trim()
        if (s === 'eth') {
          handleCurrencySelect(nativeOnChain(chainId as ChainId))
        } else if (filteredSortedTokens.length > 0) {
          if (
            filteredSortedTokens[0].symbol?.toLowerCase() === searchQuery.trim().toLowerCase() ||
            filteredSortedTokens.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokens[0])
          }
        }
      }
    },
    [filteredSortedTokens, handleCurrencySelect, searchQuery, chainId],
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens: Token[] = useSearchInactiveTokenLists(debouncedQuery)

  const visibleCurrencies: Currency[] = (() => {
    // `concat` always returns a new array
    const currencies: Currency[] = filteredSortedTokens.concat(filteredInactiveTokens)
    if (showETH && chainId) {
      currencies.unshift(nativeOnChain(chainId))
    }

    if (activeTab === Tab.All) {
      return currencies
    }

    if (activeTab === Tab.Favorites) {
      // use `currencies` so that it filters from the visible token list
      return currencies.filter(token => {
        if (token.isNative) {
          return favoriteTokens?.includeNativeToken
        }
        if (token.isToken) {
          return favoriteTokens?.addresses?.includes(token.address)
        }
        return false
      })
    }

    return []
  })()

  return (
    <ContentWrapper>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16} display="flex">
            <Trans>Select a token</Trans>
            <InfoHelper
              text={
                <Trans>
                  Find a token by searching for its name or symbol or by pasting its address below
                  <br />
                  <br />
                  You can select and trade any token on KyberSwap.
                </Trans>
              }
            />
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search token name, symbol or address`}
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
          onKeyDown={handleEnter}
          autoComplete="off"
        />
        {showCommonBases && (
          <CommonBases chainId={chainId} onSelect={handleCurrencySelect} selectedCurrency={selectedCurrency} />
        )}
        <RowBetween>
          <Flex
            sx={{
              columnGap: '24px',
            }}
          >
            <TabButton data-active={activeTab === Tab.All} onClick={() => setActiveTab(Tab.All)}>
              <Text as="span" fontSize={14} fontWeight={500}>
                <Trans>All</Trans>
              </Text>
            </TabButton>

            <TabButton data-active={activeTab === Tab.Favorites} onClick={() => setActiveTab(Tab.Favorites)}>
              <Text as="span" fontSize={14} fontWeight={500}>
                <Trans>Favorites</Trans>
              </Text>
            </TabButton>
          </Flex>
          <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
        </RowBetween>
      </PaddedColumn>

      <Separator />

      {searchToken && !searchTokenIsAdded && !isSearchTokenActive ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken.wrapped} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokens?.length > 0 || filteredInactiveTokens?.length > 0 ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <CurrencyList
                height={height}
                currencies={visibleCurrencies}
                inactiveTokens={filteredInactiveTokens}
                breakIndex={
                  activeTab === Tab.All
                    ? filteredInactiveTokens.length && filteredSortedTokens
                      ? filteredSortedTokens.length
                      : undefined
                    : undefined
                }
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
                showImportView={showImportView}
                setImportToken={setImportToken}
              />
            )}
          </AutoSizer>
        </div>
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <TYPE.main color={theme.text3} textAlign="center" mb="20px">
            <Trans>No results found.</Trans>
          </TYPE.main>
        </Column>
      )}

      <Footer>
        <Row justify="center">
          <ButtonText onClick={showManageView} color={theme.blue1} className="list-token-manage-button">
            <RowFixed>
              <IconWrapper size="16px" marginRight="6px">
                <Edit />
              </IconWrapper>
              <TYPE.main color={theme.blue1}>
                <Trans>Manage Token Lists</Trans>
              </TYPE.main>
            </RowFixed>
          </ButtonText>
        </Row>
      </Footer>
    </ContentWrapper>
  )
}
