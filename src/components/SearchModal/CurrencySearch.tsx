import * as ethers from 'ethers'

import { ButtonText, CloseIcon, IconWrapper, TYPE } from '../../theme'
import { Currency, Token } from '@uniswap/sdk-core'
import { KeyboardEvent, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PaddedColumn, SearchInput, Separator } from './styleds'
import Row, { RowBetween, RowFixed } from '../Row'
import { Trans, t } from '@lingui/macro'
import { filterTokens, useSortedTokensByQuery } from './filtering'
import { useAllTokens, useIsUserAddedToken, useSearchInactiveTokenLists, useToken } from '../../hooks/Tokens'

import AutoSizer from 'react-virtualized-auto-sizer'
import Column from '../Column'
import CommonBases from './CommonBases'
import CurrencyList from './CurrencyList'
import { Edit } from 'react-feather'
import { ExtendedEther } from '../../constants/tokens'
import { FixedSizeList } from 'react-window'
import ImportRow from './ImportRow'
import { LoadingSkeleton } from 'pages/Pool/styleds'
import ReactGA from 'react-ga'
import { Text } from 'rebass'
import { isAddress } from '../../utils'
import styled from 'styled-components/macro'
import { useActiveWeb3React } from '../../hooks/web3'
import useDebounce from 'hooks/useDebounce'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import useTheme from 'hooks/useTheme'
import useToggle from 'hooks/useToggle'
import { useTokenComparator } from './sorting'
import { useWeb3Endpoint } from 'pages/Charts/PairSearch'

const ContentWrapper = styled(Column)`
  width: 100%;
  flex: 1 1;
  position: relative;
  background:${props => props.theme.bg0};
  color: ${props => props.theme.text1};
`

const Footer = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 20px;
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  color:${props => props.theme.text1};
  background-color: ${({ theme }) => theme.bg0};
  border-top: 1px solid ${({ theme }) => theme.bg2};
`

interface CurrencySearchProps {
  isOpen: boolean
  onDismiss: () => void
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherSelectedCurrency?: Currency | null
  showCommonBases?: boolean
  showCurrencyAmount?: boolean
  disableNonToken?: boolean
  showOnlyTrumpCoins?: boolean;
  showManageView: () => void
  showImportView: () => void
  setImportToken: (token: Token) => void
}

const useSearchForToken = (address?: string, chainId?: number) => {
  const [token, setToken] = useState<Token | undefined>()
  const checksummedAddress = isAddress(address)
  const abi = [
    'function name() view returns (string name)',
    'function symbol() view returns (string symbol)',
    'function decimals() view returns (uint8 decimals)',
  ];
  const WEB3_ENDPOINT = useWeb3Endpoint()
  const handleError = (e: any) => console.error(`useSearchForToken`, e)
  useEffect(() => {
    async function getToken() {
      const { JsonRpcProvider } = ethers.providers;
      const provider = new JsonRpcProvider(WEB3_ENDPOINT);
      const contract = new ethers.Contract(checksummedAddress as string, abi, provider);

      const [decimals, name, symbol] = await Promise.all([
        contract.decimals().catch(handleError),
        contract.name().catch(handleError),
        contract.symbol().catch(handleError)
      ]);

      const token = new Token(chainId ?? 1, checksummedAddress as string, ethers.BigNumber.from(decimals).toNumber(), name, symbol);
      console.log(`token log`, Token)
      setToken(token)
    }
    if ((!token || token?.address?.toLowerCase() !== address?.toLowerCase()) && address && checksummedAddress) {
      try {
        getToken().finally(() => console.log(`Token finally loaded. `, token))
      } catch (ex: any) {

      }
    }
  }, [address, checksummedAddress])

  return token
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
  showManageView,
  showImportView,
  setImportToken,
  showOnlyTrumpCoins
}: CurrencySearchProps) {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()

  // refs for fixed size lists
  const fixedList = useRef<FixedSizeList>()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const debouncedQuery = useMemo(() => searchQuery, [searchQuery])
  const [searching, setSearching] = useState<boolean>(false)
  const [invertSearchOrder] = useState<boolean>(false)

  const allTokens = useAllTokens()

  // if they input an address, use it
  const isAddressSearch = isAddress(searchQuery)

  const searchToken = useToken(typeof isAddressSearch == 'string' ? isAddressSearch : searchQuery)
  const searchedToken = useSearchForToken(typeof isAddressSearch == 'string' ? isAddressSearch : undefined, chainId)

  const searchTokenIsAdded = useIsUserAddedToken(searchToken)
  const searchedTokenIsAdded = useIsUserAddedToken(searchedToken)

  useEffect(() => {
    if (isAddressSearch) {
      ReactGA.event({
        category: 'Currency Select',
        action: 'Search by address',
        label: isAddressSearch,
      })
    }
  }, [isAddressSearch])

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), searchQuery)
  }, [allTokens, searchQuery])

  const sortedTokens: Token[] = useMemo(() => {
    return filteredTokens.sort(tokenComparator)
  }, [filteredTokens, tokenComparator])

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery, showOnlyTrumpCoins)

  const ether = useMemo(() => chainId && ExtendedEther.onChain(chainId), [chainId])

  const filteredSortedTokensWithETH: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim()
    if (s === '' || s === 'e' || s === 'et' || s === 'eth') {
      return ether ? [ether, ...filteredSortedTokens] : filteredSortedTokens
    }
    return filteredSortedTokens
  }, [debouncedQuery, ether, filteredSortedTokens])

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      onCurrencySelect(currency)
      onDismiss()
    },
    [onDismiss, onCurrencySelect]
  )

  // clear the input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      inputRef.current && inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (searchToken || searchedToken) {
      setSearching(false)
    }
  }, [searchToken, searchedToken])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  const handleInput = useCallback((event) => {
    const input = event.target.value
    const checksummedInput = isAddress(input?.toLowerCase())
    if (checksummedInput) {
      setSearching(true)
      setSearchQuery(checksummedInput)
    } else {
      setSearchQuery(input)
    }
    fixedList.current?.scrollTo(0)
  }, [])

  const handleEnter = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        const s = debouncedQuery.toLowerCase().trim()
        if (s === 'eth' && ether) {
          handleCurrencySelect(ether)
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
    [debouncedQuery, ether, filteredSortedTokensWithETH, handleCurrencySelect]
  )

  // menu ui
  const [open, toggle] = useToggle(false)
  const node = useRef<HTMLDivElement>()
  useOnClickOutside(node, open ? toggle : undefined)

  // if no results on main list, show option to expand into inactive
  const filteredInactiveTokens = useSearchInactiveTokenLists(
    filteredTokens.length === 0 || (debouncedQuery.length > 2 && !isAddressSearch) ? debouncedQuery : undefined
  )

  return (
    <ContentWrapper>
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
      ) : searchedToken && !searchedTokenIsAdded ?
        (
          <Column style={{ padding: '20px 0', height: '100%' }}>
            <ImportRow token={searchedToken} showImportView={showImportView} setImportToken={setImportToken} />
          </Column>
        ) : filteredSortedTokens?.length > 0 || filteredInactiveTokens?.length > 0 ? (
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

                  showImportView={showImportView}
                  setImportToken={setImportToken}
                  showCurrencyAmount={showCurrencyAmount}
                />
              )}
            </AutoSizer>
          </div>
        ) : !searching ? (
          <Column style={{ padding: '20px', height: '100%' }}>
            <TYPE.main color={theme.text3} textAlign="center" mb="20px">
              <Trans>No results found.</Trans>
            </TYPE.main>
          </Column>
        ) : (
          <Column style={{ padding: '20px', height: '100%', overflow: 'scroll' }}>
            <LoadingSkeleton count={10} />
          </Column>
        )

      }

      <Footer>
        <Row justify="center">
          <ButtonText onClick={showManageView} color={'#fff'} className="list-token-manage-button">
            <RowFixed>
              <IconWrapper size="16px" marginRight="6px" stroke={theme.primaryText1}>
                <Edit style={{ color: theme.text1, stroke: theme.text1 }} />
              </IconWrapper>
              <TYPE.main color={theme.text1}>
                <Trans>Manage Token Lists</Trans>
              </TYPE.main>
            </RowFixed>
          </ButtonText>
        </Row>
      </Footer>
    </ContentWrapper>
  )
}
