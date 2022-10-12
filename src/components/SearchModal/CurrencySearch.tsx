// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { EventName, ModalName } from 'analytics/constants'
import { Trace } from 'analytics/Trace'
import { sendEvent } from 'components/analytics'
import { RedesignVariant, useRedesignFlag } from 'featureFlags/flags/redesign'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { useAllTokenBalances } from 'state/connection/hooks'
import styled, { useTheme } from 'styled-components/macro'

import { useAllTokens, useIsUserAddedToken, useSearchInactiveTokenLists, useToken } from '../../hooks/Tokens'
import { CloseIcon, ThemedText } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import { CurrencyRow, formatAnalyticsEventProperties } from './CurrencyList'
import CurrencyList from './CurrencyList'
import { PaddedColumn, SearchInput, Separator } from './styleds'

const ContentWrapper = styled(Column)<{ redesignFlag?: boolean }>`
  background-color: ${({ theme, redesignFlag }) => redesignFlag && theme.backgroundSurface};
  width: 100%;
  flex: 1 1;
  position: relative;
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCommonBases,
  showCurrencyAmount,
  disableNonToken,
  onDismiss,
  isOpen,
}: CurrencySearchProps) {
  const redesignFlag = useRedesignFlag()
  const redesignFlagEnabled = redesignFlag === RedesignVariant.Enabled

  const { chainId } = useWeb3React()
  const theme = useTheme()

  const [tokenLoaderTimerElapsed, setTokenLoaderTimerElapsed] = useState(false)

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const allTokens = useAllTokens()

  // if they input an address, use it
  const isAddressSearch = isAddress(debouncedQuery)

  const searchToken = useToken(debouncedQuery)

  const searchTokenIsAdded = useIsUserAddedToken(searchToken)

  useEffect(() => {
    if (isAddressSearch) {
      sendEvent({
        category: 'Currency Select',
        action: 'Search by address',
        label: isAddressSearch,
      })
    }
  }, [isAddressSearch])

  const filteredTokens: Token[] = useMemo(() => {
    return Object.values(allTokens).filter(getTokenFilter(debouncedQuery))
  }, [allTokens, debouncedQuery])

  const [balances, balancesAreLoading] = useAllTokenBalances()
  const sortedTokens: Token[] = useMemo(
    () => (!balancesAreLoading ? [...filteredTokens].sort(tokenComparator.bind(null, balances)) : []),
    [balances, filteredTokens, balancesAreLoading]
  )
  const isLoading = Boolean(balancesAreLoading && !tokenLoaderTimerElapsed)

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens)

  const native = useNativeCurrency()

  const filteredSortedTokensWithETH: Currency[] = useMemo(() => {
    // Use Celo ERC20 Implementation and exclude the native asset
    if (!native) {
      return filteredSortedTokens
    }

    const s = debouncedQuery.toLowerCase().trim()
    if (native.symbol?.toLowerCase()?.indexOf(s) !== -1) {
      // Always bump the native token to the top of the list.
      return [native, ...filteredSortedTokens.filter((t) => !t.equals(native))]
    }
    return filteredSortedTokens
  }, [debouncedQuery, native, filteredSortedTokens])

  const handleCurrencySelect = useCallback(
    (currency: Currency, hasWarning?: boolean) => {
      onCurrencySelect(currency, hasWarning)
      if (!hasWarning) onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = debouncedQuery.toLowerCase().trim()
        if (s === native?.symbol?.toLowerCase()) {
          handleCurrencySelect(native)
        } else if (filteredSortedTokensWithETH.length > 0) {
          if (
            filteredSortedTokensWithETH[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
            filteredSortedTokensWithETH.length === 1
          ) {
            handleCurrencySelect(filteredSortedTokensWithETH[0])
          }
        }
      }
    },
    [debouncedQuery, native, filteredSortedTokensWithETH, handleCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )

  // Timeout token loader after 3 seconds to avoid hanging in a loading state.
  useEffect(() => {
    const tokenLoaderTimer = setTimeout(() => {
      setTokenLoaderTimerElapsed(true)
    }, 3000)
    return () => clearTimeout(tokenLoaderTimer)
  }, [])

  return (
    <ContentWrapper redesignFlag={redesignFlagEnabled}>
      <Trace name={EventName.TOKEN_SELECTOR_OPENED} modal={ModalName.TOKEN_SELECTOR} shouldLogImpression>
        <PaddedColumn gap="16px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              <Trans>Select a token</Trans>
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <Row>
            <SearchInput
              type="text"
              id="token-search-input"
              placeholder={t`Search name or paste address`}
              autoComplete="off"
              redesignFlag={redesignFlagEnabled}
              value={searchQuery}
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={handleInput}
              onKeyDown={handleEnter}
            />
          </Row>
          {showCommonBases && (
            <CommonBases
              chainId={chainId}
              onSelect={handleCurrencySelect}
              selectedCurrency={selectedCurrency}
              searchQuery={searchQuery}
              isAddressSearch={isAddressSearch}
            />
          )}
        </PaddedColumn>
        <Separator redesignFlag={redesignFlagEnabled} />
        {searchToken && !searchTokenIsAdded ? (
          <Column style={{ padding: '20px 0', height: '100%' }}>
            <CurrencyRow
              currency={searchToken}
              isSelected={Boolean(searchToken && selectedCurrency && selectedCurrency.equals(searchToken))}
              onSelect={(hasWarning: boolean) => searchToken && handleCurrencySelect(searchToken, hasWarning)}
              otherSelected={Boolean(searchToken && otherSelectedCurrency && otherSelectedCurrency.equals(searchToken))}
              showCurrencyAmount={showCurrencyAmount}
              eventProperties={formatAnalyticsEventProperties(
                searchToken,
                0,
                [searchToken],
                searchQuery,
                isAddressSearch
              )}
            />
          </Column>
        ) : filteredSortedTokens?.length > 0 || filteredInactiveTokens?.length > 0 || isLoading ? (
          <div style={{ flex: '1' }}>
            <AutoSizer disableWidth>
              {({ height }) => (
                <CurrencyList
                  height={height}
                  currencies={disableNonToken ? filteredSortedTokens : filteredSortedTokensWithETH}
                  otherListTokens={filteredInactiveTokens}
                  onCurrencySelect={handleCurrencySelect}
                  otherCurrency={otherSelectedCurrency}
                  selectedCurrency={selectedCurrency}
                  fixedListRef={fixedList}
                  showCurrencyAmount={showCurrencyAmount}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  isAddressSearch={isAddressSearch}
                />
              )}
            </AutoSizer>
          </div>
        ) : (
          <Column style={{ padding: '20px', height: '100%' }}>
            <ThemedText.DeprecatedMain color={theme.deprecated_text3} textAlign="center" mb="20px">
              <Trans>No results found.</Trans>
            </ThemedText.DeprecatedMain>
          </Column>
        )}
      </Trace>
    </ContentWrapper>
  )
}
