import { Currency, ETHER, Token } from 'dxswap-sdk'
import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactGA from 'react-ga'
import styled from 'styled-components'
import { transparentize } from 'polished'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useToken } from '../../hooks/Tokens'
import { CloseIcon, TYPE } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { filterTokens } from './filtering'
import SortButton from './SortButton'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
}

const Wrapper = styled.div`
  width: 100%;

  background: ${({ theme }) => transparentize(0.45, theme.bg2)};
`

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  onDismiss,
  isOpen
}: CurrencySearchProps) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()

  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)
  const allTokens = useAllTokens()

  // if they input an address, use it
  const isAddressSearch = isAddress(searchQuery)
  const searchToken = useToken(searchQuery)

  useEffect(() => {
    if (isAddressSearch) {
      ReactGA.event({
        category: 'Currency Select',
        action: 'Search by address',
        label: isAddressSearch
      })
    }
  }, [isAddressSearch])

  const showETH: boolean = useMemo(() => {
    const s = searchQuery.toLowerCase().trim()
    return s === '' || s === 'e' || s === 'et' || s === 'eth'
  }, [searchQuery])

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const filteredTokens: Token[] = useMemo(() => {
    if (isAddressSearch) return searchToken ? [searchToken] : []
    return filterTokens(Object.values(allTokens), searchQuery)
  }, [isAddressSearch, searchToken, allTokens, searchQuery])

  const filteredSortedTokens: Token[] = useMemo(() => {
    if (searchToken) return [searchToken]
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
      ...sorted.filter(token => token.symbol?.toLowerCase() !== symbolMatch[0])
    ]
  }, [filteredTokens, searchQuery, searchToken, tokenComparator])

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
        const s = searchQuery.toLowerCase().trim()
        if (s === 'eth') {
          handleCurrencySelect(ETHER)
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
    [filteredSortedTokens, handleCurrencySelect, searchQuery]
  )

  return (
    <Wrapper>
      <Column style={{ width: '100%', height: '100%', flex: '1 1' }}>
        <PaddedColumn gap="16px">
          <RowBetween>
            <TYPE.body fontWeight={500} fontSize={16}>
              Select a token
            </TYPE.body>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder={t('tokenSearchPlaceholder')}
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
          {showCommonBases && (
            <CommonBases chainId={chainId} onSelect={handleCurrencySelect} selectedCurrency={selectedCurrency} />
          )}
          <RowBetween>
            <TYPE.body fontSize="11px" lineHeight="13px" letterSpacing="0.06em">
              NAME
            </TYPE.body>
            <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
          </RowBetween>
        </PaddedColumn>

        <Separator />

        <div style={{ flex: '1' }}>
          <CurrencyList
            showETH={showETH}
            currencies={filteredSortedTokens}
            onCurrencySelect={handleCurrencySelect}
            otherCurrency={otherSelectedCurrency}
            selectedCurrency={selectedCurrency}
          />
        </div>
      </Column>
    </Wrapper>
  )
}
