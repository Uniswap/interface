// eslint-disable-next-line no-restricted-imports
import { t, Trans } from '@lingui/macro'
import { InterfaceEventName, InterfaceModalName } from '@uniswap/analytics-events'
import { Currency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { Trace } from 'analytics'
import { useCachedPortfolioBalancesQuery } from 'components/PrefetchBalancesWrapper/PrefetchBalancesWrapper'
import { isTaikoChain } from 'config/chains/taiko'
import { COMMON_BASES } from 'constants/routing'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useToggle from 'hooks/useToggle'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import { TokenBalances, tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import styled, { useTheme } from 'styled-components'
import { UserAddedToken } from 'types/tokens'

import { useDefaultActiveTokens, useIsUserAddedToken, useSearchInactiveTokenLists, useToken } from '../../hooks/Tokens'
import { CloseIcon, ThemedText } from '../../theme'
import { isAddress } from '../../utils'
import Column from '../Column'
import Row, { RowBetween } from '../Row'
import CommonBases from './CommonBases'
import { CurrencyRow, formatAnalyticsEventProperties } from './CurrencyList'
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
  const { chainId, account } = useWeb3React()
  const theme = useTheme()

  const [tokenLoaderTimerElapsed, setTokenLoaderTimerElapsed] = useState(false)

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useDebounce(searchQuery, 200)
  const isAddressSearch = isAddress(debouncedQuery)
  const searchToken = useToken(debouncedQuery)
  const searchTokenIsAdded = useIsUserAddedToken(searchToken)

  const defaultTokens = useDefaultActiveTokens(chainId)

  // For Taiko, use COMMON_BASES instead of token lists since TKO might not be in any active list
  const isTaiko = chainId && isTaikoChain(chainId)
  const taikoCurrencies = useMemo(() => {
    if (!isTaiko || !chainId) return []
    return COMMON_BASES[chainId] || []
  }, [isTaiko, chainId])

  const filteredTokens: Token[] = useMemo(() => {
    // For Taiko, use tokens from COMMON_BASES instead of active lists
    if (isTaiko) {
      return taikoCurrencies
        .filter((c): c is Token => c.isToken)
        .filter(getTokenFilter(debouncedQuery))
    }
    return Object.values(defaultTokens).filter(getTokenFilter(debouncedQuery))
  }, [defaultTokens, debouncedQuery, isTaiko, taikoCurrencies])

  const { data, loading: balancesAreLoading } = useCachedPortfolioBalancesQuery({ account })

  // For Taiko, use COMMON_BASES currencies for balance fetching
  const onChainBalances = useCurrencyBalances(account, isTaiko ? taikoCurrencies : [])

  const balances: TokenBalances = useMemo(() => {
    // For Taiko chains, use on-chain balances from multicall
    if (isTaiko) {
      console.log('[TOKEN SELECTOR] Taiko on-chain balances:', {
        currencyCount: taikoCurrencies.length,
        balanceCount: onChainBalances.length,
        balances: onChainBalances.map((b, i) => ({
          currency: taikoCurrencies[i]?.symbol,
          balance: b?.toExact(),
        })),
      })
      const balanceMap: TokenBalances = {}
      taikoCurrencies.forEach((currency, index) => {
        const balance = onChainBalances[index]
        if (balance) {
          const address = currency.isNative ? 'ETH' : currency.isToken ? currency.address?.toLowerCase() : undefined
          if (address) {
            balanceMap[address] = {
              balance: balance.toExact(),
              usdValue: 0, // USD value not available from on-chain data
            }
          }
        }
      })
      console.log('[TOKEN SELECTOR] Balance map:', balanceMap)
      return balanceMap
    }

    // For other chains, use GraphQL API
    return (
      data?.portfolios?.[0].tokenBalances?.reduce((balanceMap, tokenBalance) => {
        if (
          tokenBalance.token?.chain &&
          supportedChainIdFromGQLChain(tokenBalance.token?.chain) === chainId &&
          tokenBalance.token?.address !== undefined &&
          tokenBalance.denominatedValue?.value !== undefined
        ) {
          const address = tokenBalance.token?.standard === 'ERC20' ? tokenBalance.token?.address?.toLowerCase() : 'ETH'
          const usdValue = tokenBalance.denominatedValue?.value
          const balance = tokenBalance.quantity
          balanceMap[address] = { usdValue, balance: balance ?? 0 }
        }
        return balanceMap
      }, {} as TokenBalances) ?? {}
    )
  }, [chainId, data?.portfolios, taikoCurrencies, onChainBalances, isTaiko])

  const sortedTokens: Token[] = useMemo(
    () =>
      !balancesAreLoading
        ? filteredTokens
            .filter((token) => {
              if (onlyShowCurrenciesWithBalance) {
                const tokenBalance = balances[token.address?.toLowerCase()]
                // For Taiko, check actual balance since usdValue is not available
                if (isTaiko) {
                  return tokenBalance && parseFloat(tokenBalance.balance?.toString() || '0') > 0
                }
                return tokenBalance?.usdValue > 0
              }

              // If there is no query, filter out unselected user-added tokens with no balance.
              if (!debouncedQuery && token instanceof UserAddedToken) {
                if (selectedCurrency?.equals(token) || otherSelectedCurrency?.equals(token)) return true
                const tokenBalance = balances[token.address.toLowerCase()]
                // For Taiko, check actual balance since usdValue is not available
                if (isTaiko) {
                  return tokenBalance && parseFloat(tokenBalance.balance?.toString() || '0') > 0
                }
                return tokenBalance?.usdValue > 0
              }
              return true
            })
            .sort(tokenComparator.bind(null, balances))
        : filteredTokens,
    [
      balancesAreLoading,
      filteredTokens,
      balances,
      onlyShowCurrenciesWithBalance,
      debouncedQuery,
      selectedCurrency,
      otherSelectedCurrency,
    ]
  )
  const isLoading = Boolean(balancesAreLoading && !tokenLoaderTimerElapsed)

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens)

  const native = useNativeCurrency(chainId)
  const wrapped = native.wrapped

  const searchCurrencies: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim()

    const tokens = filteredSortedTokens.filter((t) => !(t.equals(wrapped) || (disableNonToken && t.isNative)))
    const wrappedBalance = balances[wrapped.address]
    const shouldShowWrapped =
      !onlyShowCurrenciesWithBalance ||
      (!balancesAreLoading &&
        (isTaiko
          ? wrappedBalance && parseFloat(wrappedBalance.balance?.toString() || '0') > 0
          : wrappedBalance?.usdValue > 0))
    const natives = (
      disableNonToken || native.equals(wrapped) ? [wrapped] : shouldShowWrapped ? [native, wrapped] : [native]
    ).filter((n) => n.symbol?.toLowerCase()?.indexOf(s) !== -1 || n.name?.toLowerCase()?.indexOf(s) !== -1)

    return [...natives, ...tokens]
  }, [
    debouncedQuery,
    filteredSortedTokens,
    onlyShowCurrenciesWithBalance,
    balancesAreLoading,
    balances,
    wrapped,
    disableNonToken,
    native,
  ])

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
        } else if (searchCurrencies.length > 0) {
          if (
            searchCurrencies[0].symbol?.toLowerCase() === debouncedQuery.trim().toLowerCase() ||
            searchCurrencies.length === 1
          ) {
            handleCurrencySelect(searchCurrencies[0])
          }
        }
      }
    },
    [debouncedQuery, native, searchCurrencies, handleCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    !onlyShowCurrenciesWithBalance && (filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch))
      ? debouncedQuery
      : undefined
  )

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
        ) : searchCurrencies?.length > 0 || filteredInactiveTokens?.length > 0 || isLoading ? (
          <div style={{ flex: '1' }}>
            <AutoSizer disableWidth>
              {({ height }) => (
                <CurrencyList
                  height={height}
                  currencies={searchCurrencies}
                  otherListTokens={filteredInactiveTokens}
                  onCurrencySelect={handleCurrencySelect}
                  otherCurrency={otherSelectedCurrency}
                  selectedCurrency={selectedCurrency}
                  fixedListRef={fixedList}
                  showCurrencyAmount={showCurrencyAmount}
                  isLoading={isLoading}
                  searchQuery={searchQuery}
                  isAddressSearch={isAddressSearch}
                  balances={balances}
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
