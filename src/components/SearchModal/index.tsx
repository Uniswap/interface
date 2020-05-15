import React, { useState, useRef, useMemo, useEffect, useContext } from 'react'
import '@reach/tooltip/styles.css'
import styled, { ThemeContext } from 'styled-components'
import { JSBI, Token, WETH } from '@uniswap/sdk'
import { isMobile } from 'react-device-detect'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { COMMON_BASES } from '../../constants'
import { useAllTokenBalancesTreatingWETHasETH } from '../../state/wallet/hooks'
import { Link as StyledLink } from '../../theme/components'

import Card from '../../components/Card'
import Modal from '../Modal'
import Circle from '../../assets/images/circle.svg'
import TokenLogo from '../TokenLogo'
import DoubleTokenLogo from '../DoubleLogo'
import Column, { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { Hover } from '../../theme'
import { ArrowLeft } from 'react-feather'
import { CloseIcon } from '../../theme/components'
import { ButtonPrimary, ButtonSecondary } from '../../components/Button'
import { Spinner, TYPE } from '../../theme'
import { RowBetween, RowFixed, AutoRow } from '../Row'

import { isAddress, escapeRegExp } from '../../utils'
import { useWeb3React } from '../../hooks'
import {
  useAllDummyPairs,
  useFetchTokenByAddress,
  useAddUserToken,
  useRemoveUserAddedToken,
  useUserAddedTokens
} from '../../state/user/hooks'
import { useTranslation } from 'react-i18next'
import { useToken, useAllTokens } from '../../hooks/Tokens'
import QuestionHelper from '../Question'

const TokenModalInfo = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 1rem 1rem;
  margin: 0.25rem 0.5rem;
  justify-content: center;
  user-select: none;
  min-height: 200px;
`

const ItemList = styled.div`
  flex-grow: 1;
  height: 240px;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
`

const FadedSpan = styled(RowFixed)`
  color: ${({ theme }) => theme.primary1};
  font-size: 14px;
`

const GreySpan = styled.span`
  color: ${({ theme }) => theme.text3};
  font-weight: 400;
`

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
  color: ${({ theme }) => theme.text4};
  opacity: 0.6;
`

const Input = styled.input`
  position: relative;
  display: flex;
  padding: 16px;
  align-items: center;
  width: 100%;
  white-space: nowrap;
  background: none;
  border: none;
  outline: none;
  box-sizing: border-box;
  border-radius: 20px;
  color: ${({ theme }) => theme.text1};
  border-style: solid;
  border: 1px solid ${({ theme }) => theme.bg3};
  -webkit-appearance: none;

  font-size: 18px;

  ::placeholder {
    color: ${({ theme }) => theme.text3};
  }
`

const FilterWrapper = styled(RowFixed)`
  padding: 8px;
  background-color: ${({ selected, theme }) => selected && theme.bg2};
  color: ${({ selected, theme }) => (selected ? theme.text1 : theme.text2)};
  border-radius: 8px;
  user-select: none;
  & > * {
    user-select: none;
  }
  :hover {
    cursor: pointer;
  }
`

const PaddedColumn = styled(AutoColumn)`
  padding: 20px;
  padding-bottom: 12px;
`

const PaddedItem = styled(RowBetween)`
  padding: 4px 20px;
  height: 56px;
`

const MenuItem = styled(PaddedItem)`
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  pointer-events: ${({ disabled }) => disabled && 'none'};
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.bg2};
  }
  opacity: ${({ disabled, selected }) => (disabled || selected ? 0.5 : 1)};
`

const BaseWrapper = styled(AutoRow)<{ disable?: boolean }>`
  border: 1px solid ${({ theme, disable }) => (disable ? 'transparent' : theme.bg3)};
  padding: 0 6px;
  border-radius: 10px;
  width: 120px;

  :hover {
    cursor: ${({ disable }) => !disable && 'pointer'};
    background-color: ${({ theme, disable }) => !disable && theme.bg2};
  }

  background-color: ${({ theme, disable }) => disable && theme.bg3};
  opacity: ${({ disable }) => disable && '0.4'};
`

// filters on results
const FILTERS = {
  VOLUME: 'VOLUME',
  LIQUIDITY: 'LIQUIDITY',
  BALANCES: 'BALANCES'
}

interface SearchModalProps extends RouteComponentProps<{}> {
  isOpen?: boolean
  onDismiss?: () => void
  filterType?: 'tokens'
  hiddenToken?: string
  showSendWithSwap?: boolean
  onTokenSelect?: (address: string) => void
  urlAddedTokens?: Token[]
  otherSelectedTokenAddress?: string
  otherSelectedText?: string
  showCommonBases?: boolean
}

function SearchModal({
  history,
  isOpen,
  onDismiss,
  onTokenSelect,
  urlAddedTokens,
  filterType,
  hiddenToken,
  showSendWithSwap,
  otherSelectedTokenAddress,
  otherSelectedText,
  showCommonBases = false
}: SearchModalProps) {
  const { t } = useTranslation()
  const { account, chainId } = useWeb3React()
  const theme = useContext(ThemeContext)

  const allTokens = useAllTokens()
  const allPairs = useAllDummyPairs()
  const allBalances = useAllTokenBalancesTreatingWETHasETH()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortDirection, setSortDirection] = useState(true)

  const userAddedTokens = useUserAddedTokens()
  const fetchTokenByAddress = useFetchTokenByAddress()
  const addToken = useAddUserToken()
  const removeTokenByAddress = useRemoveUserAddedToken()

  // if the current input is an address, and we don't have the token in context, try to fetch it
  const token = useToken(searchQuery)
  const [temporaryToken, setTemporaryToken] = useState<Token | null>()

  // filters for ordering
  const [activeFilter, setActiveFilter] = useState(FILTERS.BALANCES)

  // toggle specific token import view
  const [showTokenImport, setShowTokenImport] = useState(false)

  // used to help scanning on results, put token found from input on left
  const [identifiedToken, setIdentifiedToken] = useState<Token | null>()

  useEffect(() => {
    const address = isAddress(searchQuery)
    if (address && !token) {
      let stale = false
      fetchTokenByAddress(address).then(token => {
        if (!stale) {
          setTemporaryToken(token)
        }
      })
      return () => {
        stale = true
        setTemporaryToken(null)
      }
    }
  }, [searchQuery, token, fetchTokenByAddress])

  // reset view on close
  useEffect(() => {
    if (!isOpen) {
      setShowTokenImport(false)
    }
  }, [isOpen])

  const tokenList = useMemo(() => {
    return Object.keys(allTokens)
      .sort((a, b): number => {
        if (a && allTokens[a]?.equals(WETH[chainId])) return -1
        if (b && allTokens[b]?.equals(WETH[chainId])) return 1

        if (allTokens[a].symbol && allTokens[b].symbol) {
          const aSymbol = allTokens[a].symbol.toLowerCase()
          const bSymbol = allTokens[b].symbol.toLowerCase()
          // sort by balance
          const balanceA = allBalances?.[account]?.[a]
          const balanceB = allBalances?.[account]?.[b]

          if (balanceA?.greaterThan('0') && !balanceB?.greaterThan('0')) {
            return sortDirection ? -1 : 1
          }
          if (!balanceA?.greaterThan('0') && balanceB?.greaterThan('0')) {
            return sortDirection ? 1 : -1
          }
          return aSymbol < bSymbol ? -1 : aSymbol > bSymbol ? 1 : 0
        } else {
          return 0
        }
      })
      .map(k => {
        return {
          name: allTokens[k].name,
          symbol: allTokens[k].symbol,
          address: k,
          balance: allBalances?.[account]?.[k]
        }
      })
  }, [allTokens, allBalances, account, sortDirection, chainId])

  const filteredTokenList = useMemo(() => {
    return tokenList.filter(tokenEntry => {
      const urlAdded = urlAddedTokens?.some(token => token.address === tokenEntry.address)
      const customAdded = userAddedTokens?.some(token => token.address === tokenEntry.address) && !urlAdded

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
  }, [tokenList, urlAddedTokens, userAddedTokens, showTokenImport, searchQuery])

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

  const sortedPairList = useMemo(() => {
    return allPairs.sort((a, b): number => {
      // sort by balance
      const balanceA = allBalances?.[account]?.[a.liquidityToken.address]
      const balanceB = allBalances?.[account]?.[b.liquidityToken.address]

      if (balanceA?.greaterThan('0') && !balanceB?.greaterThan('0')) {
        return sortDirection ? -1 : 1
      }
      if (!balanceA?.greaterThan('0') && balanceB?.greaterThan('0')) {
        return sortDirection ? 1 : -1
      } else {
        return 0
      }
    })
  }, [account, allBalances, allPairs, sortDirection])

  const filteredPairList = useMemo(() => {
    const isAddress = searchQuery.slice(0, 2) === '0x'
    return sortedPairList.filter(pair => {
      if (searchQuery === '') {
        return true
      }
      const token0 = pair.token0
      const token1 = pair.token1
      if (!token0 || !token1) {
        return false // no token fetched yet
      } else {
        const regexMatches = Object.keys(token0).map(field => {
          if (
            (field === 'address' && isAddress) ||
            (field === 'name' && !isAddress) ||
            (field === 'symbol' && !isAddress)
          ) {
            if (token0[field].match(new RegExp(escapeRegExp(searchQuery), 'i'))) {
              setIdentifiedToken(token0)
            }
            if (token1[field].match(new RegExp(escapeRegExp(searchQuery), 'i'))) {
              setIdentifiedToken(token1)
            }
            return (
              token0[field].match(new RegExp(escapeRegExp(searchQuery), 'i')) ||
              token1[field].match(new RegExp(escapeRegExp(searchQuery), 'i'))
            )
          }
          return false
        })
        return regexMatches.some(m => m)
      }
    })
  }, [searchQuery, sortedPairList])

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
        if (temporaryToken === undefined) {
          return <TokenModalInfo>Searching for Token...</TokenModalInfo>
        } else if (temporaryToken === null) {
          return <TokenModalInfo>Address is not a valid ERC-20 token.</TokenModalInfo>
        } else {
          // a user found a token by search that isn't yet added to localstorage
          return (
            <MenuItem
              key={temporaryToken.address}
              className={`temporary-token-${temporaryToken}`}
              onClick={() => {
                addToken(temporaryToken)
                _onTokenSelect(temporaryToken.address)
              }}
            >
              <RowFixed>
                <TokenLogo address={temporaryToken.address} size={'24px'} style={{ marginRight: '14px' }} />
                <Column>
                  <Text fontWeight={500}>{temporaryToken.symbol}</Text>
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
      return filteredTokenList
        .sort((a, b) => {
          if (a.address === WETH[chainId].address) {
            return -1
          } else if (b.address === WETH[chainId].address) {
            return 1
          } else if (a.balance?.greaterThan('0') && !b.balance?.greaterThan('0')) {
            return sortDirection ? -1 : 1
          } else if (!a.balance?.greaterThan('0') && b.balance?.greaterThan('0')) {
            return sortDirection ? 1 : -1
          } else {
            return sortDirection ? -1 : 1
          }
        })
        .map(({ address, symbol, balance }) => {
          const urlAdded = urlAddedTokens?.some(token => token.address === address)
          const customAdded = userAddedTokens?.some(token => token.address === address) && !urlAdded

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
                    <TYPE.main fontWeight={500}>
                      {urlAdded && 'Added by URL'}
                      {customAdded && 'Added by user'}
                    </TYPE.main>
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

  const Filter = ({ title, filter, filterType }: { title: string; filter: string; filterType: string }) => {
    return (
      <FilterWrapper
        onClick={() => {
          setActiveFilter(filter)
          setSortDirection(!sortDirection)
        }}
        selected={filter === activeFilter}
      >
        <Text fontSize={14} fontWeight={500}>
          {title}
        </Text>
        {filter === activeFilter && filterType === 'tokens' && (
          <Text fontSize={14} fontWeight={500}>
            {sortDirection ? '↓' : '↑'}
          </Text>
        )}
      </FilterWrapper>
    )
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
                <Hover>
                  <ArrowLeft
                    onClick={() => {
                      setShowTokenImport(false)
                    }}
                  />
                </Hover>
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
                {filterType === 'tokens' ? 'Select A Token' : 'Select A Pool'}
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
              <Filter
                title={filterType === 'tokens' ? 'Your Balances' : ' '}
                filter={FILTERS.BALANCES}
                filterType={filterType}
              />
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
