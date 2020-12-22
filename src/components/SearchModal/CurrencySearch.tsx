import { Currency, ETHER, Token } from '@uniswap/sdk'
import React, { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactGA from 'react-ga'
import { useTranslation } from 'react-i18next'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useToken, useFoundOnInactiveList } from '../../hooks/Tokens'
import { CloseIcon, TYPE, ButtonText, ExternalLink } from '../../theme'
import { isAddress } from '../../utils'
import { StyledMenu, LinkIcon } from './styleds'
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
import { ButtonDropdownGrey } from '../Button'
import styled from 'styled-components'
import useToggle from 'hooks/useToggle'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import TLLogo from '../../assets/images/token-list-logo.png'
import Card, { GreyCard, OutlineCard } from 'components/Card'
import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { Import } from './Import'

const MenuWrapper = styled.div`
  position: absolute;
  top: 74px;
  right: 0;
  background: ${({ theme }) => theme.bg1};
  box-shadow: 0px 24px 32px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 0px 1px rgba(0, 0, 0, 0.04);
  border-radius: 12px;
  z-index: 4;
`

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  & > * {
    stroke: ${({ theme }) => theme.text1};
  }
`

const MenuItem = styled(ButtonText)`
  background: ${({ theme }) => theme.bg3};
  :hover {
    opacity: 0.8;
    cursor: pointer;
  }
`

const Wrapper = styled.div`
  position: relative;
  border-radius: 20px;
  padding: 1rem;
`

const Footer = styled.div`
  position: absolute;
  bottom: 1rem;
  width: calc(100% - 2rem);
  border-radius: 20px;
`

const BottomWrapper = styled(GreyCard)`
  border-radius: 20px;
  padding: 0;
`

const TokenSection = styled(OutlineCard)`
  border-radius: 20px;
  padding: 1rem;
  border: 2px solid ${({ theme }) => theme.bg3};
  background-color: ${({ theme }) => theme.bg1};
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
  onChangeList: () => void
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  onDismiss,
  isOpen,
  onChangeList
}: CurrencySearchProps) {
  const { t } = useTranslation()
  const { chainId } = useActiveWeb3React()

  const fixedList = useRef<FixedSizeList>()
  const [searchQuery, setSearchQuery] = useState<string>('YFI')
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

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  const inactiveTokens: Token[] | undefined = useFoundOnInactiveList(searchQuery)

  const [showImport, setShowImport] = useState(true)
  const [importToken, setImportToken] = useState<Token | undefined>()

  if (showImport && importToken) {
    return <Import onBack={() => setShowImport(false)} token={importToken} />
  }

  return (
    <Column style={{ width: '100%', flex: '1 1' }}>
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
          <StyledMenu ref={node as any}>
            <ButtonDropdownGrey width="60px" ml="10px" onClick={toggle} />
            {open && (
              <MenuWrapper>
                <GreyCard>
                  <AutoColumn gap="md">
                    <MenuItem>
                      <RowFixed>
                        <IconWrapper>
                          <PlusCircle />
                        </IconWrapper>
                        <TYPE.body ml="10px" style={{ whiteSpace: 'nowrap' }}>
                          Import Token
                        </TYPE.body>
                      </RowFixed>
                    </MenuItem>
                    <MenuItem onClick={onChangeList}>
                      <RowFixed>
                        <IconWrapper>
                          <List />
                        </IconWrapper>
                        <TYPE.body ml="10px" style={{ whiteSpace: 'nowrap' }}>
                          Manage Lists
                        </TYPE.body>
                      </RowFixed>
                    </MenuItem>
                  </AutoColumn>
                </GreyCard>
              </MenuWrapper>
            )}
          </StyledMenu>
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
      {filteredSortedTokens?.length > 0 ? (
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
      ) : (
        <Wrapper>
          <Card>
            <TYPE.main textAlign="center">No result found on active lists.</TYPE.main>
          </Card>
          {inactiveTokens?.[0] && (
            <Footer>
              <BottomWrapper>
                <AutoColumn>
                  <RowBetween padding="1rem">
                    <WrappedLogo src={TLLogo} alt="token lists" />
                    <TYPE.body fontWeight={500}>1 result</TYPE.body>
                  </RowBetween>
                  <TokenSection>
                    <RowBetween>
                      <AutoColumn gap="sm">
                        <RowFixed>
                          <CurrencyLogo currency={inactiveTokens[0]} size={'24px'} />
                          <TYPE.body ml="10px" fontWeight={500}>
                            {inactiveTokens[0]?.symbol}
                          </TYPE.body>
                          <LinkIcon href={''} />
                        </RowFixed>
                      </AutoColumn>
                      <ButtonPrimary
                        width="fit-content"
                        padding="8px 10px"
                        onClick={() => {
                          setImportToken(inactiveTokens[0])
                          setShowImport(true)
                        }}
                      >
                        Add
                      </ButtonPrimary>
                    </RowBetween>
                  </TokenSection>
                </AutoColumn>
              </BottomWrapper>
            </Footer>
          )}
        </Wrapper>
      )}
    </Column>
  )
}
