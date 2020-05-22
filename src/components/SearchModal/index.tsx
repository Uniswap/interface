import '@reach/tooltip/styles.css'
import { ChainId, JSBI, Token, WETH } from '@uniswap/sdk'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ArrowLeft } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import Circle from '../../assets/images/circle.svg'
import Card from '../../components/Card'
import { COMMON_BASES } from '../../constants'
import { ALL_TOKENS } from '../../constants/tokens'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useAllDummyPairs, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { CursorPointer, TYPE } from '../../theme'
import { CloseIcon, Link as StyledLink } from '../../theme/components'
import { escapeRegExp, isAddress } from '../../utils'
import { ButtonPrimary, ButtonSecondary } from '../Button'
import Column, { AutoColumn } from '../Column'
import DoubleTokenLogo from '../DoubleLogo'
import Modal from '../Modal'
import QuestionHelper from '../Question'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import TokenLogo from '../TokenLogo'
import { useTokenComparator } from './sorting'
import {
  BaseWrapper,
  FadedSpan,
  GreySpan,
  Input,
  ItemList,
  MenuItem,
  PaddedColumn,
  SpinnerWrapper,
  TokenModalInfo
} from './styleds'
import { TokenSortButton } from './TokenSortButton'

interface SearchModalProps extends RouteComponentProps {
  isOpen?: boolean
  onDismiss?: () => void
  filterType?: 'tokens'
  hiddenToken?: string
  showSendWithSwap?: boolean
  onTokenSelect?: (address: string) => void
  otherSelectedTokenAddress?: string
  otherSelectedText?: string
  showCommonBases?: boolean
}

function isDefaultToken(tokenAddress: string, chainId?: number): boolean {
  const address = isAddress(tokenAddress)
  return Boolean(chainId && address && ALL_TOKENS[chainId as ChainId]?.[tokenAddress])
}

function SearchModal({
  history,
  isOpen,
  onDismiss,
  onTokenSelect,
  filterType,
  hiddenToken,
  showSendWithSwap,
  otherSelectedTokenAddress,
  otherSelectedText,
  showCommonBases = false
}: SearchModalProps) {
  const { t } = useTranslation()
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const allTokens = useAllTokens()
  const allPairs = useAllDummyPairs()
  const allBalances = useAllTokenBalancesTreatingWETHasETH()

  const [searchQuery, setSearchQuery] = useState('')
  const [invertSearchOrder, setInvertSearchOrder] = useState(false)

  const removeTokenByAddress = useRemoveUserAddedToken()

  // if the current input is an address, and we don't have the token in context, try to fetch it
  const searchQueryToken = useTokenByAddressAndAutomaticallyAdd(searchQuery)

  // toggle specific token import view
  const [showTokenImport, setShowTokenImport] = useState(false)

  // used to help scanning on results, put token found from input on left
  const [identifiedToken, setIdentifiedToken] = useState<Token>()

  // reset view on close
  useEffect(() => {
    if (!isOpen) {
      setShowTokenImport(false)
    }
  }, [isOpen])

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const sortedTokenList = useMemo(() => {
    return Object.values(allTokens)
      .sort(tokenComparator)
      .map(token => {
        return {
          name: token.name,
          symbol: token.symbol,
          address: token.address,
          balance: allBalances[account]?.[token.address]
        }
      })
  }, [allTokens, tokenComparator, allBalances, account])

  const filteredTokenList = useMemo(() => {
    return sortedTokenList.filter(tokenEntry => {
      const customAdded = !isDefaultToken(tokenEntry.address, chainId)

      // if token import page dont show preset list, else show all
      const include = !showTokenImport || (showTokenImport && customAdded && searchQuery !== '')

      const inputIsAddress = searchQuery.slice(0, 2) === '0x'
      const regexMatches = Object.keys(tokenEntry).map(tokenEntryKey => {
        if (tokenEntryKey === 'address') {
          return (
            include &&
            inputIsAddress &&
            typeof tokenEntry[tokenEntryKey] === 'string' &&
            !!tokenEntry[tokenEntryKey].match(new RegExp(escapeRegExp(searchQuery), 'i'))
          )
        }
        return (
          include &&
          typeof tokenEntry[tokenEntryKey] === 'string' &&
          !!tokenEntry[tokenEntryKey].match(new RegExp(escapeRegExp(searchQuery), 'i'))
        )
      })
      return regexMatches.some(m => m)
    })
  }, [sortedTokenList, chainId, showTokenImport, searchQuery])

  function _onTokenSelect(address) {
    setSearchQuery('')
    onTokenSelect(address)
    onDismiss()
  }

  // manage focus on modal show
  const inputRef = useRef()
  function onInput(event) {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
  }

  function clearInputAndDismiss() {
    setSearchQuery('')
    onDismiss()
  }

  // make an effort to identify the specific token a user is searching for
  useEffect(() => {
    const searchQueryIsAddress = !!isAddress(searchQuery)

    // try to find an exact match by address
    if (searchQueryIsAddress) {
      const identifiedTokenByAddress = Object.values(allTokens).filter(token => {
        return searchQueryIsAddress && token.address === isAddress(searchQuery)
      })
      if (identifiedTokenByAddress.length > 0) setIdentifiedToken(identifiedTokenByAddress[0])
    }
    // try to find an exact match by symbol
    else {
      const identifiedTokenBySymbol = Object.values(allTokens).filter(token => {
        return token.symbol.slice(0, searchQuery.length).toLowerCase() === searchQuery.toLowerCase()
      })
      if (identifiedTokenBySymbol.length > 0) setIdentifiedToken(identifiedTokenBySymbol[0])
    }

    return () => {
      setIdentifiedToken(undefined)
    }
  }, [allTokens, searchQuery])

  const sortedPairList = useMemo(() => {
    return allPairs.sort((a, b): number => {
      // sort by balance
      const balanceA = allBalances[account]?.[a.liquidityToken.address]
      const balanceB = allBalances[account]?.[b.liquidityToken.address]
      if (balanceA?.greaterThan('0') && !balanceB?.greaterThan('0')) return !invertSearchOrder ? -1 : 1
      if (!balanceA?.greaterThan('0') && balanceB?.greaterThan('0')) return !invertSearchOrder ? 1 : -1
      if (balanceA?.greaterThan('0') && balanceB?.greaterThan('0')) {
        return balanceA.greaterThan(balanceB) ? (!invertSearchOrder ? -1 : 1) : !invertSearchOrder ? 1 : -1
      }
      return 0
    })
  }, [allPairs, allBalances, account, invertSearchOrder])

  const filteredPairList = useMemo(() => {
    const searchQueryIsAddress = !!isAddress(searchQuery)
    return sortedPairList.filter(pair => {
      // if there's no search query, hide non-ETH pairs
      if (searchQuery === '') return pair.token0.equals(WETH[chainId]) || pair.token1.equals(WETH[chainId])

      const token0 = pair.token0
      const token1 = pair.token1

      if (searchQueryIsAddress) {
        if (token0.address === isAddress(searchQuery)) return true
        if (token1.address === isAddress(searchQuery)) return true
      } else {
        const identifier0 = `${token0.symbol}/${token1.symbol}`
        const identifier1 = `${token1.symbol}/${token0.symbol}`
        if (identifier0.slice(0, searchQuery.length).toLowerCase() === searchQuery.toLowerCase()) return true
        if (identifier1.slice(0, searchQuery.length).toLowerCase() === searchQuery.toLowerCase()) return true
      }
      return false
    })
  }, [searchQuery, sortedPairList, chainId])

  function renderPairsList() {
    if (filteredPairList?.length === 0) {
      return (
        <PaddedColumn justify="center">
          <Text>No Pools Found</Text>
        </PaddedColumn>
      )
    }

    return (
      filteredPairList &&
      filteredPairList.map((pair, i) => {
        // reset ordering to help scan search results
        const token0 = identifiedToken ? (identifiedToken.equals(pair.token0) ? pair.token0 : pair.token1) : pair.token0
        const token1 = identifiedToken ? (identifiedToken.equals(pair.token0) ? pair.token1 : pair.token0) : pair.token1
        const pairAddress = pair.liquidityToken.address
        const balance = allBalances?.[account]?.[pairAddress]?.toSignificant(6)
        const zeroBalance =
          allBalances?.[account]?.[pairAddress]?.raw &&
          JSBI.equal(allBalances?.[account]?.[pairAddress].raw, JSBI.BigInt(0))
        return (
          <MenuItem
            key={i}
            onClick={() => {
              history.push('/add/' + token0.address + '-' + token1.address)
              onDismiss()
            }}
          >
            <RowFixed>
              <DoubleTokenLogo a0={token0?.address || ''} a1={token1?.address || ''} size={24} margin={true} />
              <Text fontWeight={500} fontSize={16}>{`${token0?.symbol}/${token1?.symbol}`}</Text>
            </RowFixed>

            <ButtonPrimary
              padding={'6px 8px'}
              width={'fit-content'}
              borderRadius={'12px'}
              onClick={() => {
                history.push('/add/' + token0.address + '-' + token1.address)
                onDismiss()
              }}
            >
              {balance ? (zeroBalance ? 'Join' : 'Add Liquidity') : 'Join'}
            </ButtonPrimary>
          </MenuItem>
        )
      })
    )
  }

  function renderTokenList() {
    if (filteredTokenList.length === 0) {
      if (isAddress(searchQuery)) {
        if (!searchQueryToken) {
          return <TokenModalInfo>Searching...</TokenModalInfo>
        } else {
          // a user found a token by search that isn't yet added to localstorage
          return (
            <MenuItem
              key={searchQueryToken.address}
              className={`temporary-token-${searchQueryToken.address}`}
              onClick={() => {
                _onTokenSelect(searchQueryToken.address)
              }}
            >
              <RowFixed>
                <TokenLogo address={searchQueryToken.address} size={'24px'} style={{ marginRight: '14px' }} />
                <Column>
                  <Text fontWeight={500}>{searchQueryToken.symbol}</Text>
                  <FadedSpan>(Found by search)</FadedSpan>
                </Column>
              </RowFixed>
            </MenuItem>
          )
        }
      } else {
        return <TokenModalInfo>{t('noToken')}</TokenModalInfo>
      }
    } else {
      return filteredTokenList.map(({ address, symbol, balance }) => {
        const customAdded = !isDefaultToken(address, chainId)

        const zeroBalance = balance && JSBI.equal(JSBI.BigInt(0), balance.raw)

        // if token import page dont show preset list, else show all
        return (
          <MenuItem
            key={address}
            className={`token-item-${address}`}
            onClick={() => (hiddenToken && hiddenToken === address ? null : _onTokenSelect(address))}
            disabled={hiddenToken && hiddenToken === address}
            selected={otherSelectedTokenAddress === address}
          >
            <RowFixed>
              <TokenLogo address={address} size={'24px'} style={{ marginRight: '14px' }} />
              <Column>
                <Text fontWeight={500}>
                  {symbol}
                  {otherSelectedTokenAddress === address && <GreySpan> ({otherSelectedText})</GreySpan>}
                </Text>
                <FadedSpan>
                  <TYPE.main fontWeight={500}>{customAdded && 'Added by user'}</TYPE.main>
                  {customAdded && (
                    <div
                      onClick={event => {
                        event.stopPropagation()
                        if (searchQuery === address) {
                          setSearchQuery('')
                        }
                        removeTokenByAddress(chainId, address)
                      }}
                    >
                      <StyledLink style={{ marginLeft: '4px', fontWeight: 400 }}>(Remove)</StyledLink>
                    </div>
                  )}
                </FadedSpan>
              </Column>
            </RowFixed>
            <AutoColumn gap="4px" justify="end">
              {balance ? (
                <Text>
                  {zeroBalance && showSendWithSwap ? (
                    <ButtonSecondary padding={'4px 8px'}>
                      <Text textAlign="center" fontWeight={500} fontSize={14} color={theme.primary1}>
                        Send With Swap
                      </Text>
                    </ButtonSecondary>
                  ) : balance ? (
                    balance.toSignificant(6)
                  ) : (
                    '-'
                  )}
                </Text>
              ) : account ? (
                <SpinnerWrapper src={Circle} alt="loader" />
              ) : (
                '-'
              )}
            </AutoColumn>
          </MenuItem>
        )
      })
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={clearInputAndDismiss}
      maxHeight={70}
      initialFocusRef={isMobile ? undefined : inputRef}
    >
      <Column style={{ width: '100%' }}>
        {showTokenImport ? (
          <PaddedColumn gap="lg">
            <RowBetween>
              <RowFixed>
                <CursorPointer>
                  <ArrowLeft
                    onClick={() => {
                      setShowTokenImport(false)
                    }}
                  />
                </CursorPointer>
                <Text fontWeight={500} fontSize={16} marginLeft={'10px'}>
                  Import A Token
                </Text>
              </RowFixed>
              <CloseIcon onClick={onDismiss} />
            </RowBetween>
            <TYPE.body style={{ marginTop: '10px' }}>
              To import a custom token, paste token address in the search bar.
            </TYPE.body>
            <Input type={'text'} placeholder={'0x000000...'} value={searchQuery} ref={inputRef} onChange={onInput} />
            {renderTokenList()}
          </PaddedColumn>
        ) : (
          <PaddedColumn gap="20px">
            <RowBetween>
              <Text fontWeight={500} fontSize={16}>
                {filterType === 'tokens' ? 'Select a token' : 'Select a pool'}
              </Text>
              <CloseIcon onClick={onDismiss} />
            </RowBetween>
            <Input
              type={'text'}
              id="token-search-input"
              placeholder={t('tokenSearchPlaceholder')}
              value={searchQuery}
              ref={inputRef}
              onChange={onInput}
            />
            {showCommonBases && (
              <AutoColumn gap="md">
                <AutoRow>
                  <Text fontWeight={500} fontSize={16}>
                    Common Bases
                  </Text>
                  <QuestionHelper text="These tokens are commonly used in pairs." />
                </AutoRow>
                <AutoRow gap="10px">
                  {COMMON_BASES[chainId]?.map(token => {
                    return (
                      <BaseWrapper
                        gap="6px"
                        onClick={() => hiddenToken !== token.address && _onTokenSelect(token.address)}
                        disable={hiddenToken === token.address}
                        key={token.address}
                      >
                        <TokenLogo address={token.address} />
                        <Text fontWeight={500} fontSize={16}>
                          {token.symbol}
                        </Text>
                      </BaseWrapper>
                    )
                  })}
                </AutoRow>
              </AutoColumn>
            )}
            <RowBetween>
              <Text fontSize={14} fontWeight={500}>
                {filterType === 'tokens' ? 'Token Name' : 'Pool Name'}
              </Text>
              {filterType === 'tokens' && (
                <TokenSortButton
                  invertSearchOrder={invertSearchOrder}
                  toggleSortOrder={() => setInvertSearchOrder(iso => !iso)}
                  title={filterType === 'tokens' ? 'Your Balances' : ' '}
                />
              )}
            </RowBetween>
          </PaddedColumn>
        )}
        {!showTokenImport && <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />}
        {!showTokenImport && <ItemList>{filterType === 'tokens' ? renderTokenList() : renderPairsList()}</ItemList>}
        {!showTokenImport && <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />}
        {!showTokenImport && (
          <Card>
            <AutoRow justify={'center'}>
              <div>
                {filterType !== 'tokens' && (
                  <Text fontWeight={500}>
                    {!isMobile && "Don't see a pool? "}
                    <StyledLink
                      onClick={() => {
                        history.push('/find')
                      }}
                    >
                      {!isMobile ? 'Import it.' : 'Import pool.'}
                    </StyledLink>
                  </Text>
                )}
                {filterType === 'tokens' && (
                  <Text fontWeight={500} color={theme.text2} fontSize={14}>
                    {!isMobile && "Don't see a token? "}

                    <StyledLink
                      onClick={() => {
                        setShowTokenImport(true)
                      }}
                    >
                      {!isMobile ? 'Import it.' : 'Import custom token.'}
                    </StyledLink>
                  </Text>
                )}
              </div>
            </AutoRow>
          </Card>
        )}
      </Column>
    </Modal>
  )
}

export default withRouter(SearchModal)
