// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import { useTokenBalances } from 'hooks/useTokenBalances'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { getSortedPortfolioTokens, tokenQuerySortComparator } from 'lib/hooks/useTokenList/sorting'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { CloseIcon, ThemedText } from 'theme/components'
import { UserAddedToken } from 'types/tokens'

import { useDefaultActiveTokens, useSearchInactiveTokenLists, useToken } from '../../hooks/Tokens'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import { CurrencyListSectionTitle, CurrencyRow, formatAnalyticsEventProperties } from './CurrencyList'
import CurrencyList from './CurrencyList'
import { PaddedColumn, SearchInput, Separator } from './styled'

const ContentWrapper = styled(Column)`
  background-color: ${({ theme }) => theme.surface1};
  width: 100%;
  overflow: hidden;
  flex: 1 1;
  position: relative;
  border-radius: 20px;
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
  onlyShowCurrenciesWithBalance?: boolean
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
  onlyShowCurrenciesWithBalance,
}: CurrencySearchProps) {
  const { chainId } = useWeb3React()
  const theme = useTheme()

  const [tokenLoaderTimerElapsed, setTokenLoaderTimerElapsed] = useState(false)

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isAddressSearch = isAddress(debouncedQuery)
  const searchToken = useToken(debouncedQuery)

  const defaultTokens = useDefaultActiveTokens(chainId)
  const { balanceMap, balanceList, loading: balancesAreLoading } = useTokenBalances()
  const { sortedCombinedTokens, portfolioTokens, sortedTokensWithoutPortfolio } = useMemo(() => {
    const filteredListTokens = Object.values(defaultTokens)
      // Filter out tokens with balances so they aren't duplicated when we merge below.
      .filter((token) => !(token.address?.toLowerCase() in balanceMap))

    if (balancesAreLoading) {
      const sortedCombinedTokens = debouncedQuery
        ? filteredListTokens.filter(getTokenFilter(debouncedQuery)).sort(tokenQuerySortComparator(debouncedQuery))
        : filteredListTokens
      return {
        sortedCombinedTokens,
        portfolioTokens: [],
        sortedTokensWithoutPortfolio: sortedCombinedTokens,
      }
    }

    const portfolioTokens = getSortedPortfolioTokens(balanceList, balanceMap, chainId, {
      hideSmallBalances: false,
      hideSpam: true,
    })
    const mergedTokens = [...(portfolioTokens ?? []), ...filteredListTokens]

    const tokenFilter = (token: Token) => {
      if (onlyShowCurrenciesWithBalance) {
        if (token.isNative && token.symbol) {
          return balanceMap[token.symbol]?.usdValue > 0
        }

        return balanceMap[token.address?.toLowerCase()]?.usdValue > 0
      }

      if (token.isNative && disableNonToken) {
        return false
      }

      // If there is no query, filter out unselected user-added tokens with no balance.
      if (!debouncedQuery && token instanceof UserAddedToken) {
        if (selectedCurrency?.equals(token) || otherSelectedCurrency?.equals(token)) return true
        return balanceMap[token.address.toLowerCase()]?.usdValue > 0
      }

      return true
    }

    const sortedCombinedTokens = debouncedQuery
      ? mergedTokens.filter(getTokenFilter(debouncedQuery)).sort(tokenQuerySortComparator(debouncedQuery))
      : mergedTokens

    return {
      sortedCombinedTokens: sortedCombinedTokens.filter(tokenFilter),
      sortedTokensWithoutPortfolio: filteredListTokens.filter(tokenFilter),
      portfolioTokens: portfolioTokens.filter(tokenFilter),
    }
  }, [
    defaultTokens,
    balancesAreLoading,
    balanceList,
    balanceMap,
    chainId,
    debouncedQuery,
    onlyShowCurrenciesWithBalance,
    disableNonToken,
    selectedCurrency,
    otherSelectedCurrency,
  ])

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
        const s = debouncedQuery.toLowerCase().trim()
        if (s === native?.symbol?.toLowerCase()) {
          handleCurrencySelect(native)
        } else if (sortedCombinedTokens.length > 0) {
          if (
            sortedCombinedTokens[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
            sortedCombinedTokens.length === 1
          ) {
            handleCurrencySelect(sortedCombinedTokens[0])
          }
        }
      }
    },
    [debouncedQuery, native, sortedCombinedTokens, handleCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    !onlyShowCurrenciesWithBalance &&
      (sortedCombinedTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch))
      ? debouncedQuery
      : undefined
  )

  const finalCurrencyList = useMemo(() => {
    if (debouncedQuery || portfolioTokens.length === 0) {
      return [
        new CurrencyListSectionTitle(debouncedQuery ? t`Search Results` : t`Popular tokens`),
        ...sortedCombinedTokens,
        ...filteredInactiveTokens,
      ]
    }

    if (sortedTokensWithoutPortfolio.length === 0 && filteredInactiveTokens.length === 0) {
      return [new CurrencyListSectionTitle(t`Your tokens`), ...portfolioTokens]
    }

    return [
      new CurrencyListSectionTitle(t`Your tokens`),
      ...portfolioTokens,
      new CurrencyListSectionTitle(t`Popular tokens`),
      ...sortedTokensWithoutPortfolio,
      ...filteredInactiveTokens,
    ]
  }, [debouncedQuery, filteredInactiveTokens, portfolioTokens, sortedCombinedTokens, sortedTokensWithoutPortfolio])

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
          <Row>
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
        {searchToken ? (
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
              balance={
                tryParseCurrencyAmount(
                  String(balanceMap[searchToken.isNative ? 'ETH' : searchToken.address?.toLowerCase()]?.balance ?? 0),
                  searchToken
                ) ?? CurrencyAmount.fromRawAmount(searchToken, 0)
              }
            />
          </Column>
        ) : sortedCombinedTokens?.length > 0 || filteredInactiveTokens?.length > 0 || isLoading ? (
          <div style={{ flex: '1' }}>
            <AutoSizer disableWidth>
              {({ height }: { height: number }) => (
                <CurrencyList
                  height={height}
                  currencies={finalCurrencyList}
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
