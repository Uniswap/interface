import { t } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { MouseoverTooltip } from 'components/Tooltip'
import { ConnectionType } from 'connection'
import { useGetConnection } from 'connection'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useSelectChain from 'hooks/useSelectChain'
import useSyncChainQuery from 'hooks/useSyncChainQuery'
import { Box } from 'nft/components/Box'
import { Portal } from 'nft/components/common/Portal'
import { Column, Row } from 'nft/components/Flex'
import { useIsMobile } from 'nft/hooks'
import { ChangeEvent, KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronUp } from 'react-feather'
import { useTheme } from 'styled-components/macro'
import { FixedSizeList } from 'react-window'

import * as styles from './TokenSelector.css'
import TokenSelectorRow from './TokenSelectorRow'
import { NavDropdown } from 'components/NavBar/NavDropdown'
import { useCurrency, useDefaultActiveTokens } from 'hooks/Tokens'
import { Currency, Token } from '@uniswap/sdk-core'
import { getTokenFilter } from 'lib/hooks/useTokenList/filtering'
import useDebounce from 'hooks/useDebounce'
import { isAddress } from 'utils'
import { useAllTokenBalances } from 'state/connection/hooks'
import { UserAddedToken } from 'types/tokens'
import { Field } from 'state/swap/actions'
import { useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { tokenComparator, useSortTokensByQuery } from 'lib/hooks/useTokenList/sorting'
import { currencyId } from 'utils/currencyId'
import { SearchInput } from 'components/SearchModal/styleds'
import { ThemedText } from 'theme'



export const TokenSelector = ({ isInput }: { isInput: boolean}) => {

  const onlyShowCurrenciesWithBalance = false;
  const {
    [Field.INPUT]: { currencyId: inputCurrencyId },
    [Field.OUTPUT]: { currencyId: outputCurrencyId },
  } = useSwapState();

  const {
    onCurrencySelection
  } = useSwapActionHandlers()

  const inputCurrency = useCurrency(inputCurrencyId)
  const outputCurrency = useCurrency(outputCurrencyId)

  // const {chainId} = useWeb3React()
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  const debouncedQuery = useDebounce(searchQuery, 200)
  const defaultTokens = useDefaultActiveTokens()


  const [tokenLoaderTimerElapsed, setTokenLoaderTimerElapsed] = useState(false)
    // Timeout token loader after 3 seconds to avoid hanging in a loading state.
    useEffect(() => {
      const tokenLoaderTimer = setTimeout(() => {
        setTokenLoaderTimerElapsed(true)
      }, 3000)
      return () => clearTimeout(tokenLoaderTimer)
    }, [])
  
  const filteredTokens: Token[] = useMemo(() => {
    return Object.values(defaultTokens).filter(getTokenFilter(debouncedQuery))
  }, [defaultTokens, debouncedQuery])

  const [balances, balancesAreLoading] = useAllTokenBalances()

  const sortedTokens: Token[] = useMemo(
    () =>
      !balancesAreLoading
        ? filteredTokens
            .filter((token) => {
              if (onlyShowCurrenciesWithBalance) {
                return balances[token.address]?.greaterThan(0)
              }

              // If there is no query, filter out unselected user-added tokens with no balance.
              if (!debouncedQuery && token instanceof UserAddedToken) {
                if (inputCurrency?.equals(token) || outputCurrency?.equals(token)) return true
                return balances[token.address]?.greaterThan(0)
              }
              return true
            })
            .sort(tokenComparator.bind(null, balances))
        : [],
    [
      balances,
      balancesAreLoading,
      debouncedQuery,
      filteredTokens,
      inputCurrency,
      outputCurrency,
      onlyShowCurrenciesWithBalance,
    ]
  )
  const isLoading = Boolean(balancesAreLoading && !tokenLoaderTimerElapsed)

  const filteredSortedTokens = useSortTokensByQuery(debouncedQuery, sortedTokens)

  const fixedList = useRef<FixedSizeList>()

  const native = useNativeCurrency()
  const wrapped = native.wrapped

  const searchCurrencies: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim()

    const tokens = filteredSortedTokens.filter((t) => !(t.equals(wrapped) || (t.isNative)))
    const shouldShowWrapped =
      !onlyShowCurrenciesWithBalance || (!balancesAreLoading && balances[wrapped.address]?.greaterThan(0))
    const natives = (
      native.equals(wrapped) ? [wrapped] : shouldShowWrapped ? [native, wrapped] : [native]
    ).filter((n) => n.symbol?.toLowerCase()?.indexOf(s) !== -1 || n.name?.toLowerCase()?.indexOf(s) !== -1)

    return [...natives, ...tokens]
  }, [
    debouncedQuery,
    filteredSortedTokens,
    onlyShowCurrenciesWithBalance,
    balancesAreLoading,
    balances,
    wrapped,
    native,
  ])

  const handleCurrencySelect = useCallback((currency: Currency) => {
    onCurrencySelection(isInput ? Field.INPUT : Field.OUTPUT, currency)
  }, [inputCurrencyId, outputCurrencyId, isInput])

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

  const [isOpen, setIsOpen] = useState<boolean>(false)
  const isMobile = useIsMobile()

  const theme = useTheme()

  const ref = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => setIsOpen(false), [modalRef])


  const dropdown = (
    <NavDropdown top="56" ref={modalRef}>
      <Row>
        <SearchInput
          type="text"
          id="token-search-input"
          placeholder={t`Search name or paste address`}
          autoComplete="off"
          value={searchQuery}
          ref={inputRef as RefObject<HTMLInputElement>}
          onChange={handleInput}
          onKeyDown={handleEnter}
        />
      </Row>
      <Column paddingX="8">
        {searchCurrencies.map((currency: Currency) => (
          <TokenSelectorRow
            currencyId={currencyId(currency)}
            isInput={isInput}
            onCurrencySelect={handleCurrencySelect}
          />
        ))}
      </Column>
    </NavDropdown>
  )

  const chevronProps = {
    height: 20,
    width: 20,
    color: theme.textSecondary,
  }

  return (
    <Box position="relative" ref={ref}>
        <Row
          as="button"
          gap="8"
          className={styles.ChainSelector}
          background={isOpen ? 'accentActiveSoft' : 'none'}
          onClick={() => setIsOpen(!isOpen)}
        >
          <ThemedText.LmtWhite>
            {isInput ? inputCurrency?.symbol : outputCurrency?.symbol}
          </ThemedText.LmtWhite>
          {isOpen ? <ChevronUp {...chevronProps} /> : <ChevronDown {...chevronProps} />}
        </Row>
      {isOpen && (isMobile ? <Portal>{dropdown}</Portal> : <>{dropdown}</>)}
    </Box>
  )
}
