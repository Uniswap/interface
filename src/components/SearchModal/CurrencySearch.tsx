import { Currency, Token } from '@swapr/sdk'
import React, { KeyboardEvent, RefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useAllTokens, useToken, useSearchInactiveTokenLists } from '../../hooks/Tokens'
import { CloseIcon, TYPE } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { filterTokens, useSortedTokensByQuery } from './filtering'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import styled, { ThemeContext } from 'styled-components/macro'
import useToggle from '../../hooks/useToggle'
import { useOnClickOutside } from '../../hooks/useOnClickOutside'
import useDebounce from '../../hooks/useDebounce'
import { useActiveWeb3React } from '../../hooks'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'
import { ButtonPrimary } from '../Button'

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: ${({ theme }) => theme.bg1And2};
`

const Footer = styled.div`
  width: 100%;
  border-radius: 8px;
  padding: 16px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  background-color: ${({ theme }) => theme.bg1And2};
  border-top: 1px solid ${({ theme }) => theme.bg1And2};
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
  showNativeCurrency?: boolean
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
  showNativeCurrency
}: CurrencySearchProps) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const fixedList = useRef<FixedSizeList>()

  const nativeCurrency = useNativeCurrency()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const [invertSearchOrder] = useState<boolean>(false)

  const allTokens = useAllTokens()

  // if they input an address, use it
  const isAddressSearch = isAddress(debouncedQuery)

  const searchToken = useToken(debouncedQuery)

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery)
  }, [allTokens, debouncedQuery])

  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator)
  }, [filteredTokens, tokenComparator])

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery)

  const filteredSortedTokensWithNativeCurrency: Currency[] = useMemo(() => {
    if (!showNativeCurrency) return filteredSortedTokens
    const s = debouncedQuery.toLowerCase().trim()
    if (nativeCurrency.symbol && nativeCurrency.symbol.toLowerCase().startsWith(s)) {
      return nativeCurrency ? [nativeCurrency, ...filteredSortedTokens] : filteredSortedTokens
    }
    return filteredSortedTokens
  }, [showNativeCurrency, filteredSortedTokens, debouncedQuery, nativeCurrency])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
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
        const s = debouncedQuery.toLowerCase().trim()
        if (s === nativeCurrency.symbol) {
          handleCurrencySelect(nativeCurrency)
        } else if (filteredSortedTokensWithNativeCurrency.length > 0) {
          if (
            filteredSortedTokensWithNativeCurrency[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
            filteredSortedTokensWithNativeCurrency.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokensWithNativeCurrency[0])
          }
        }
      }
    },
    [debouncedQuery, filteredSortedTokensWithNativeCurrency, handleCurrencySelect, nativeCurrency]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )
  const filteredInactiveTokensWithFallback = useMemo(() => {
    if (filteredTokens.length > 0) return []
    if (filteredInactiveTokens.length > 0) return filteredInactiveTokens
    if (searchToken) return [searchToken]
    return []
  }, [filteredInactiveTokens, filteredTokens.length, searchToken])

  return (
    <ContentWrapper>
      <PaddedColumn gap="16px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            Select a token
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <Row>
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder={t('tokenSearchPlaceholder')}
            autoComplete="off"
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
        </Row>
        {showCommonBases && (
          <CommonBases chainId={chainId} onSelect={handleCurrencySelect} selectedCurrency={selectedCurrency} />
        )}
      </PaddedColumn>
      <Separator />
      {filteredSortedTokens?.length > 0 || filteredInactiveTokensWithFallback.length > 0 ? (
        <CurrencyList
          currencies={filteredSortedTokensWithNativeCurrency}
          otherListTokens={filteredInactiveTokensWithFallback}
          onCurrencySelect={handleCurrencySelect}
          otherCurrency={otherSelectedCurrency}
          selectedCurrency={selectedCurrency}
          fixedListRef={fixedList}
          showImportView={showImportView}
          setImportToken={setImportToken}
        />
      ) : (
        <Column style={{ padding: '20px', height: '100%' }}>
          <TYPE.main color={theme.text3} textAlign="center" mb="20px">
            No results found.
          </TYPE.main>
        </Column>
      )}
      <Footer>
        <Row justify="center">
          <ButtonPrimary onClick={showManageView}>Manage token lists</ButtonPrimary>
        </Row>
      </Footer>
    </ContentWrapper>
  )
}
