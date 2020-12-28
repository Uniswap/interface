import { Currency, ETHER, Token } from '@uniswap/sdk'
import React, {
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  CSSProperties
} from 'react'
import ReactGA from 'react-ga'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useToken, useFoundOnInactiveList, useIsUserAddedToken } from '../../hooks/Tokens'
import { CloseIcon, TYPE, ButtonText } from '../../theme'
import { isAddress } from '../../utils'
import Column, { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import Row, { RowBetween, RowFixed } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { filterTokens } from './filtering'
import SortButton from './SortButton'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import AutoSizer from 'react-virtualized-auto-sizer'
import { PlusCircle, List } from 'react-feather'
import styled from 'styled-components'
import useToggle from 'hooks/useToggle'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import TLLogo from '../../assets/images/token-list-logo.png'
import Card, { OutlineCard } from 'components/Card'
import useTheme from 'hooks/useTheme'
import ImportRow from './ImportRow'

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
  padding-bottom: 80px;
`

const Footer = styled.div`
  position: absolute;
  width: 100%;
  bottom: 0;
  border-radius: 20px;
  padding: 20px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  background-color: ${({ theme }) => theme.bg2};
`

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  & > * {
    stroke: ${({ theme }) => theme.blue1};
  }
`

const Wrapper = styled.div`
  padding: 20px;
  height: 100%;
`

const WrappedLogo = styled.img`
  height: 20px;
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showManageListView: () => void
  showManageTokensView: () => void
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
  showManageListView,
  showManageTokensView,
  showImportView,
  setImportToken
}: CurrencySearchProps) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()
  const fixedImportList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)

  const allTokens = useAllTokens()
  const inactiveTokens: Token[] | undefined = useFoundOnInactiveList(searchQuery)

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
    // if (isAddressSearch) return searchToken ? [searchToken] : []
    return filterTokens(Object.values(allTokens), searchQuery)
  }, [allTokens, searchQuery])

  const filteredSortedTokens: Token[] = useMemo(() => {
    // if (searchToken) return [searchToken]
    const sorted = filteredTokens.sort(tokenComparator)
    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)
    if (symbolMatch.length > 1) return sorted

    return [
      // sort any exact symbol matches first
      ...sorted.filter(token => token.symbol?.toLowerCase() === symbolMatch[0]),
      ...sorted.filter(token => token.symbol?.toLowerCase() !== symbolMatch[0])
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

  const ImportDataRow = useCallback(
    ({ data, index, style }: { data: Token[]; index: number; style: CSSProperties }) => {
      const token: Token = data[index]
      return <ImportRow token={token} style={style} showImportView={showImportView} setImportToken={setImportToken} />
    },
    [setImportToken, showImportView]
  )

  return (
    <ContentWrapper>
      <PaddedColumn gap="14px">
        <RowBetween>
          <Text fontWeight={500} fontSize={16}>
            Select a token
            <QuestionHelper text="Find a token by searching for its name or symbol or by pasting its address below." />
          </Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        <Row>
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder={t('tokenSearchPlaceholder')}
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            onChange={handleInput}
            onKeyDown={handleEnter}
          />
        </Row>
        {showCommonBases && (
          <CommonBases chainId={chainId} onSelect={handleCurrencySelect} selectedCurrency={selectedCurrency} />
        )}
        <RowBetween>
          <Text fontSize={14} fontWeight={500}>
            Token Name
          </Text>
          <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
        </RowBetween>
      </PaddedColumn>
      <Separator />
      {searchToken && !searchTokenIsAdded ? (
        <Wrapper>
          <ImportRow token={searchToken} showImportView={showImportView} setImportToken={setImportToken} />
        </Wrapper>
      ) : filteredSortedTokens?.length > 0 ? (
        <div style={{ flex: '1' }}>
          <AutoSizer disableWidth>
            {({ height }) => (
              <CurrencyList
                height={height}
                showETH={showETH}
                currencies={filteredSortedTokens}
                onCurrencySelect={handleCurrencySelect}
                otherCurrency={otherSelectedCurrency}
                selectedCurrency={selectedCurrency}
                fixedListRef={fixedList}
              />
            )}
          </AutoSizer>
        </div>
      ) : inactiveTokens && inactiveTokens.length > 0 ? (
        <Wrapper>
          <AutoColumn>
            <Card paddingTop="0 !important;">
              <TYPE.main color={theme.text3} textAlign="center">
                No results found in active lists.
              </TYPE.main>
            </Card>
            <Card borderRadius="8px" mb="10px" backgroundColor={theme.bg2} padding="6px 8px">
              <RowBetween>
                <TYPE.main fontWeight={500}>Showing expanded results via</TYPE.main>
                <Card borderRadius="8px" backgroundColor={theme.bg3} padding="4px 6px" width="fit-content">
                  <WrappedLogo src={TLLogo} alt="token lists" />
                </Card>
              </RowBetween>
            </Card>
          </AutoColumn>
          <div style={{ flex: '1', height: '100%', paddingBottom: '40px' }}>
            <AutoSizer disableWidth>
              {({ height }) => (
                <FixedSizeList
                  height={height}
                  ref={fixedImportList as any}
                  width="100%"
                  itemData={inactiveTokens}
                  itemCount={inactiveTokens.length}
                  itemSize={56}
                >
                  {ImportDataRow}
                </FixedSizeList>
              )}
            </AutoSizer>
          </div>
        </Wrapper>
      ) : (
        <Wrapper>
          <TYPE.main>No results</TYPE.main>
        </Wrapper>
      )}
      <Footer>
        <RowBetween width="100%">
          <OutlineCard padding="8px 20px" width="48%">
            <ButtonText onClick={showManageTokensView}>
              <RowFixed>
                <IconWrapper>
                  <PlusCircle size="16px" />
                </IconWrapper>
                <TYPE.body ml="6px" color={theme.blue1}>
                  Import Token
                </TYPE.body>
              </RowFixed>
            </ButtonText>
          </OutlineCard>
          <OutlineCard padding="8px 20px" width="48%">
            <ButtonText onClick={showManageListView}>
              <RowFixed>
                <IconWrapper>
                  <List size="16px" />
                </IconWrapper>
                <TYPE.body ml="6px" color={theme.blue1}>
                  Manage Lists
                </TYPE.body>
              </RowFixed>
            </ButtonText>
          </OutlineCard>
        </RowBetween>
      </Footer>
    </ContentWrapper>
  )
}
