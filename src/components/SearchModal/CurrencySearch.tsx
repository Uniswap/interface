import { Currency, ETHER, Token } from '@uniswap/sdk'
import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactGA from 'react-ga'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useToken, useIsUserAddedToken, useFoundOnInactiveList } from '../../hooks/Tokens'
import { CloseIcon, TYPE, ButtonText, IconWrapper } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween, RowFixed } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { filterTokens } from './filtering'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import AutoSizer from 'react-virtualized-auto-sizer'
import styled from 'styled-components'
import useToggle from 'hooks/useToggle'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import ImportRow from './ImportRow'
import { Edit } from 'react-feather'
import { ButtonLight } from 'components/Button'

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
  background-color: ${({ theme }) => theme.bg1};
  border-top: 1px solid ${({ theme }) => theme.bg2};
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
  setImportToken
}: CurrencySearchProps) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder] = useState<boolean>(false)

  const allTokens = useAllTokens()
  // const inactiveTokens: Token[] | undefined = useFoundOnInactiveList(searchQuery)

  // if they input an address, use it
  const isAddressSearch = isAddress(searchQuery)
  const searchToken = useToken(searchQuery)
  const searchTokenIsAdded = useIsUserAddedToken(searchToken)

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
    return filterTokens(Object.values(allTokens), searchQuery)
  }, [allTokens, searchQuery])

  const filteredSortedTokens: Token[] = useMemo(() => {
    const sorted = filteredTokens.sort(tokenComparator)
    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)

    if (symbolMatch.length > 1) {
      return sorted
    }

    return [
      // sort any exact symbol matches first
      ...sorted.filter(token => token.symbol?.toLowerCase() === symbolMatch[0]),

      // sort by tokens whos symbols start with search substrng
      ...sorted.filter(
        token =>
          token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim()) &&
          token.symbol?.toLowerCase() !== symbolMatch[0]
      ),

      // rest that dont match upove
      ...sorted.filter(
        token =>
          !token.symbol?.toLowerCase().startsWith(searchQuery.toLowerCase().trim()) &&
          token.symbol?.toLowerCase() !== symbolMatch[0]
      )
    ]
  }, [filteredTokens, searchQuery, tokenComparator])

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

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const [showExpanded, setShowExpanded] = useState(false)
  const inactiveTokens = useFoundOnInactiveList(searchQuery)

  // reset expanded results on query reset
  useEffect(() => {
    if (searchQuery === '') {
      setShowExpanded(false)
    }
  }, [setShowExpanded, searchQuery])

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
      {searchToken && !searchTokenIsAdded ? (
        <Column style={{ padding: '20px 0', height: '100%' }}>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Column>
      ) : filteredSortedTokens?.length > 0 || (showExpanded && inactiveTokens && inactiveTokens.length > 0) ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <CurrencyList
                height={height}
                showETH={showETH}
                currencies={
                  showExpanded && inactiveTokens ? filteredSortedTokens.concat(inactiveTokens) : filteredSortedTokens
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
            No results found in active lists.
          </TYPE.main>
          {inactiveTokens &&
            inactiveTokens.length > 0 &&
            !(searchToken && !searchTokenIsAdded) &&
            searchQuery.length > 1 &&
            filteredSortedTokens?.length === 0 && (
              // expand button in line with no results
              <Row align="center" width="100%" justify="center">
                <ButtonLight
                  width="fit-content"
                  borderRadius="12px"
                  padding="8px 12px"
                  onClick={() => setShowExpanded(!showExpanded)}
                >
                  {!showExpanded
                    ? `Show ${inactiveTokens.length} more inactive ${inactiveTokens.length === 1 ? 'token' : 'tokens'}`
                    : 'Hide expanded search'}
                </ButtonLight>
              </Row>
            )}
        </Column>
      )}

      {inactiveTokens &&
        inactiveTokens.length > 0 &&
        !(searchToken && !searchTokenIsAdded) &&
        (searchQuery.length > 1 || showExpanded) &&
        (filteredSortedTokens?.length !== 0 || showExpanded) && (
          // button fixed to bottom
          <Row align="center" width="100%" justify="center" style={{ position: 'absolute', bottom: '80px', left: 0 }}>
            <ButtonLight
              width="fit-content"
              borderRadius="12px"
              padding="8px 12px"
              onClick={() => setShowExpanded(!showExpanded)}
            >
              {!showExpanded
                ? `Show ${inactiveTokens.length} more inactive ${inactiveTokens.length === 1 ? 'token' : 'tokens'}`
                : 'Hide expanded search'}
            </ButtonLight>
          </Row>
        )}
      <Footer>
        <Row justify="center">
          <ButtonText onClick={showManageView} color={theme.blue1} className="list-token-manage-button">
            <RowFixed>
              <IconWrapper size="16px" marginRight="6px">
                <Edit />
              </IconWrapper>
              <TYPE.main color={theme.blue1}>Manage</TYPE.main>
            </RowFixed>
          </ButtonText>
        </Row>
      </Footer>
    </ContentWrapper>
  )
}
