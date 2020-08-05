import { Currency, Token } from '@uniswap/sdk'
import React, { KeyboardEvent, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useToken } from '../../hooks/Tokens'
import { useSelectedListInfo } from '../../state/lists/hooks'
import { useAllTokenBalances, useTokenBalance } from '../../state/wallet/hooks'
import { CloseIcon, LinkStyledButton, TYPE } from '../../theme'
import { isAddress } from '../../utils'
import Card from '../Card'
import Column from '../Column'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { filterTokens } from './filtering'
import SortButton from './SortButton'
import { useTokenComparator } from './sorting'
import { PaddedColumn, SearchInput, Separator } from './styleds'

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  hiddenCurrency?: Currency
  showSendWithSwap?: boolean
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency
  showCommonBases?: boolean
  onChangeList: () => void
}

export function CurrencySearch({
  hiddenCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  showSendWithSwap,
  onDismiss,
  isOpen,
  onChangeList
}: CurrencySearchProps) {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)
  const allTokens = useAllTokens()

  // if the current input is an address, and we don't have the token in context, try to fetch it and import
  const searchToken = useToken(searchQuery)
  const searchTokenBalance = useTokenBalance(account ?? undefined, searchToken ?? undefined)
  const allTokenBalances_ = useAllTokenBalances()
  const allTokenBalances = searchToken
    ? {
        [searchToken.address]: searchTokenBalance
      }
    : allTokenBalances_ ?? {}

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const filteredTokens: Token[] = useMemo(() => {
    if (searchToken) return [searchToken]
    return filterTokens(Object.values(allTokens), searchQuery)
  }, [searchToken, allTokens, searchQuery])

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
  }, [isOpen, setSearchQuery])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback(event => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && filteredSortedTokens.length > 0) {
        if (
          filteredSortedTokens[0].symbol?.toLowerCase() === searchQuery.trim().toLowerCase() ||
          filteredSortedTokens.length === 1
        ) {
          handleCurrencySelect(filteredSortedTokens[0])
        }
      }
    },
    [filteredSortedTokens, handleCurrencySelect, searchQuery]
  )

  const selectedListInfo = useSelectedListInfo()

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
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t('tokenSearchPlaceholder')}
          value={searchQuery}
          ref={inputRef}
          onChange={handleInput}
          onKeyDown={handleEnter}
        />
        {showCommonBases && (
          <CommonBases chainId={chainId} onSelect={handleCurrencySelect} selectedCurrency={hiddenCurrency} />
        )}
        <RowBetween>
          <Text fontSize={14} fontWeight={500}>
            Token Name
          </Text>
          <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
        </RowBetween>
      </PaddedColumn>

      <Separator />

      <CurrencyList
        currencies={filteredSortedTokens}
        allBalances={allTokenBalances}
        onCurrencySelect={handleCurrencySelect}
        otherCurrency={otherSelectedCurrency}
        selectedCurrency={hiddenCurrency}
        showSendWithSwap={showSendWithSwap}
      />
      <Separator />
      <Card>
        <AutoRow justify={'space-between'}>
          <TYPE.main>{selectedListInfo.current?.name}</TYPE.main>
          <LinkStyledButton style={{ fontWeight: 500, color: theme.text2, fontSize: 16 }} onClick={onChangeList}>
            {selectedListInfo.current ? 'Change' : 'Select a list'}
          </LinkStyledButton>
        </AutoRow>
      </Card>
    </Column>
  )
}
