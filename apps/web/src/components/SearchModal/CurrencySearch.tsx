import { t, Trans } from '@lingui/macro'
import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { ChainSelector } from 'components/NavBar/ChainSelector'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import { useTokenBalances } from 'hooks/useTokenBalances'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'

import { useCurrencySearchResults } from 'components/SearchModal/useCurrencySearchResults'
import { isAddress } from 'utilities/src/addresses'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import CurrencyList, { CurrencyRow, formatAnalyticsEventProperties } from './CurrencyList'
import { PaddedColumn, SearchInput, Separator } from './styled'

const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  overflow: hidden;
  flex: 1 1;
  position: relative;
  border-radius: 20px;
`

const ChainSelectorWrapper = styled.div`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 12px;
`

export interface CurrencySearchFilters {
  showCommonBases?: boolean
  disableNonToken?: boolean
  onlyShowCurrenciesWithBalance?: boolean
}

const DEFAULT_CURRENCY_SEARCH_FILTERS: CurrencySearchFilters = {
  showCommonBases: true,
  disableNonToken: false,
  onlyShowCurrenciesWithBalance: false,
}

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency, hasWarning?: boolean) => void
  otherSelectedCurrency?: Currency | null
  showCurrencyAmount?: boolean
  filters?: CurrencySearchFilters
}

export function CurrencySearch({
  selectedCurrency,
  onCurrencySelect,
  otherSelectedCurrency,
  showCurrencyAmount,
  onDismiss,
  isOpen,
  filters,
}: CurrencySearchProps) {
  const { showCommonBases } = {
    ...DEFAULT_CURRENCY_SEARCH_FILTERS,
    ...filters,
  }
  const { chainId } = useWeb3React()
  const theme = useTheme()

  const [tokenLoaderTimerElapsed, setTokenLoaderTimerElapsed] = useState(false)

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isAddressSearch = isAddress(debouncedQuery)

  const { searchCurrency, allCurrencyRows } = useCurrencySearchResults({
    searchQuery: debouncedQuery,
    filters,
    selectedCurrency,
    otherSelectedCurrency,
  })

  const { balanceMap, loading: balancesAreLoading } = useTokenBalances()

  const isLoading = Boolean(balancesAreLoading && !tokenLoaderTimerElapsed)

  const native = useNativeCurrency(chainId)

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

  // Allows the user to select a currency by pressing Enter if it's the only currency in the list.
  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const currencyResults = allCurrencyRows.filter((currencyRow) => !!currencyRow.currency)
        const s = debouncedQuery.toLowerCase().trim()
        if (s === native?.symbol?.toLowerCase()) {
          handleCurrencySelect(native)
        } else if (currencyResults.length > 0) {
          if (
            currencyResults[0]?.currency &&
            (currencyResults[0].currency.symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
              currencyResults.length === 1)
          ) {
            handleCurrencySelect(currencyResults[0].currency)
          }
        }
      }
    },
    [allCurrencyRows, debouncedQuery, native, handleCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // Timeout token loader after 3 seconds to avoid hanging in a loading state.
  useEffect(() => {
    const tokenLoaderTimer = setTimeout(() => {
      setTokenLoaderTimerElapsed(true)
    }, 3000)
    return () => clearTimeout(tokenLoaderTimer)
  }, [])

  return (
    <ContentWrapper>
      <Trace
        name={InterfaceEventName.TOKEN_SELECTOR_OPENED}
        modal={InterfaceModalName.TOKEN_SELECTOR}
        shouldLogImpression
      >
        <PaddedColumn gap="16px">
          <RowBetween>
            <Text fontWeight={535} fontSize={16}>
              <Trans>Select a token</Trans>
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <Row gap="4px">
            <SearchInput
              type="text"
              id="token-search-input"
              data-testid="token-search-input"
              placeholder={t`Search name or paste address`}
              autoComplete="off"
              value={searchQuery}
              ref={inputRef as RefObject<HTMLInputElement>}
              onChange={handleInput}
              onKeyDown={handleEnter}
            />
            <ChainSelectorWrapper>
              <ChainSelector />
            </ChainSelectorWrapper>
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
        <Separator />
        {searchCurrency ? (
          <Column style={{ padding: '20px 0', height: '100%' }}>
            <CurrencyRow
              currency={searchCurrency}
              isSelected={Boolean(searchCurrency && selectedCurrency && selectedCurrency.equals(searchCurrency))}
              onSelect={(hasWarning: boolean) => searchCurrency && handleCurrencySelect(searchCurrency, hasWarning)}
              otherSelected={Boolean(
                searchCurrency && otherSelectedCurrency && otherSelectedCurrency.equals(searchCurrency)
              )}
              showCurrencyAmount={showCurrencyAmount}
              eventProperties={formatAnalyticsEventProperties(
                searchCurrency,
                0,
                [searchCurrency],
                searchQuery,
                isAddressSearch
              )}
              balance={
                tryParseCurrencyAmount(
                  String(
                    balanceMap[searchCurrency.isNative ? 'ETH' : searchCurrency.address?.toLowerCase()]?.balance ?? 0
                  ),
                  searchCurrency
                ) ?? CurrencyAmount.fromRawAmount(searchCurrency, 0)
              }
            />
          </Column>
        ) : allCurrencyRows.some((currencyRow) => !!currencyRow.currency) || isLoading ? (
          <div style={{ flex: '1' }}>
            <AutoSizer disableWidth>
              {({ height }: { height: number }) => (
                <CurrencyList
                  height={height}
                  currencies={allCurrencyRows}
                  onCurrencySelect={handleCurrencySelect}
                  otherCurrency={otherSelectedCurrency}
                  selectedCurrency={selectedCurrency}
                  fixedListRef={fixedList}
                  showCurrencyAmount={showCurrencyAmount}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  isAddressSearch={isAddressSearch}
                  balances={balanceMap}
                />
              )}
            </AutoSizer>
          </div>
        ) : (
          <Column style={{ padding: '20px', height: '100%' }}>
            <ThemedText.DeprecatedMain color={theme.neutral3} textAlign="center" mb="20px">
              <Trans>No results found.</Trans>
            </ThemedText.DeprecatedMain>
          </Column>
        )}
      </Trace>
    </ContentWrapper>
  )
}
