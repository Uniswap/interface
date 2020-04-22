import React, { useState, useRef, useMemo, useEffect } from 'react'
import '@reach/tooltip/styles.css'
import styled from 'styled-components'
import escapeStringRegex from 'escape-string-regexp'
import { JSBI } from '@uniswap/sdk'
import { Link } from 'react-router-dom'
import { ethers } from 'ethers'
import { isMobile } from 'react-device-detect'
import { withRouter } from 'react-router-dom'
import { Link as StyledLink } from '../../theme/components'

import { Hover } from '../../theme'
import Modal from '../Modal'
import Circle from '../../assets/images/circle.svg'
import TokenLogo from '../TokenLogo'
import DoubleTokenLogo from '../DoubleLogo'
import Column, { AutoColumn } from '../Column'
import { Text } from 'rebass'
import { LightCard } from '../Card'
import { ArrowLeft } from 'react-feather'
import { CloseIcon } from '../../theme/components'
import { ColumnCenter } from '../../components/Column'
import { Spinner, TYPE } from '../../theme'
import { ButtonSecondary } from '../Button'
import { RowBetween, RowFixed } from '../Row'

import { isAddress } from '../../utils'
import { useAllPairs } from '../../contexts/Pairs'
import { useWeb3React } from '../../hooks'
import { useSavedTokens } from '../../contexts/LocalStorage'
import { useAllBalances } from '../../contexts/Balances'
import { useTranslation } from 'react-i18next'
import { useToken, useAllTokens, INITIAL_TOKENS_CONTEXT } from '../../contexts/Tokens'

const TokenModalInfo = styled.div`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: center;
  padding: 1rem 1.5rem;
  margin: 0.25rem 0.5rem;
  justify-content: center;
  user-select: none;
`

const TokenList = styled.div`
  flex-grow: 1;
  height: 100%;
  overflow-y: scroll;
  -webkit-overflow-scrolling: touch;
`

const FadedSpan = styled.span`
  color: ${({ theme }) => theme.blue1};
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
  border: 1px solid #edeef2;
  box-sizing: border-box;
  border-radius: 20px;
  color: ${({ theme }) => theme.text1};
  font-size: 18px;

  ::placeholder {
    color: ${({ theme }) => theme.text3};
  }
`

const TokenModal = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  width: 100%;
`

const FilterWrapper = styled(RowFixed)`
  padding: 8px;
  background-color: ${({ selected, theme }) => selected && theme.bg2};
  color: ${({ selected, theme }) => (selected ? theme.black : '#888D9B')};
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
  padding: 24px;
  padding-bottom: 12px;
`

const PaddedItem = styled(RowBetween)`
  padding: 4px 24px;
  /* width: calc(100% - 48px); */
  height: 56px;
`

const MenuItem = styled(PaddedItem)`
  cursor: ${({ disabled }) => !disabled && 'pointer'};
  :hover {
    background-color: ${({ theme, disabled }) => !disabled && theme.bg2};
  }
  opacity: ${({ disabled }) => (disabled ? 0.5 : 1)};
`
// filters on results
const FILTERS = {
  VOLUME: 'VOLUME',
  LIQUIDITY: 'LIQUIDITY',
  BALANCES: 'BALANCES'
}

function SearchModal({
  history,
  isOpen,
  onDismiss,
  onTokenSelect,
  urlAddedTokens,
  filterType,
  hiddenToken,
  showSendWithSwap
}) {
  const { t } = useTranslation()
  const { account, chainId } = useWeb3React()

  const allTokens = useAllTokens()
  const allPairs = useAllPairs()

  const allBalances = useAllBalances()

  const [searchQuery, setSearchQuery] = useState('')
  const [sortDirection, setSortDirection] = useState(true)

  const token = useToken(searchQuery)
  const tokenAddress = token && token.address

  // amount of tokens to display at once
  const [, setTokensShown] = useState(0)
  const [, setPairsShown] = useState(0)

  const [activeFilter, setActiveFilter] = useState(FILTERS.BALANCES)

  const [showTokenImport, setShowTokenImport] = useState(false)

  const [, saveUserToken] = useSavedTokens()

  // reset view on close
  useEffect(() => {
    if (!isOpen) {
      setShowTokenImport(false)
    }
  }, [isOpen])

  const tokenList = useMemo(() => {
    return Object.keys(allTokens)
      .sort((a, b) => {
        if (allTokens[a].symbol && allTokens[b].symbol) {
          const aSymbol = allTokens[a].symbol.toLowerCase()
          const bSymbol = allTokens[b].symbol.toLowerCase()
          // pin ETH to top
          if (aSymbol === 'ETH'.toLowerCase() || bSymbol === 'ETH'.toLowerCase()) {
            return aSymbol === bSymbol ? 0 : aSymbol === 'ETH'.toLowerCase() ? -1 : 1
          }
          // sort by balance
          const balanceA = allBalances?.[account]?.[a]
          const balanceB = allBalances?.[account]?.[b]

          if (balanceA && !balanceB) {
            return sortDirection
          }
          if (!balanceA && balanceB) {
            return sortDirection * -1
          }
          if (balanceA && balanceB) {
            return sortDirection * parseFloat(balanceA.toExact()) > parseFloat(balanceB.toExact()) ? -1 : 1
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
  }, [allTokens, allBalances, account, sortDirection])

  const filteredTokenList = useMemo(() => {
    return tokenList.filter(tokenEntry => {
      const urlAdded = urlAddedTokens && urlAddedTokens.hasOwnProperty(tokenEntry.address)
      const customAdded =
        tokenEntry.address !== 'ETH' &&
        INITIAL_TOKENS_CONTEXT[chainId] &&
        !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(tokenEntry.address) &&
        !urlAdded

      // if token import page dont show preset list, else show all
      const include = !showTokenImport || (showTokenImport && customAdded && searchQuery !== '')

      const inputIsAddress = searchQuery.slice(0, 2) === '0x'
      const regexMatches = Object.keys(tokenEntry).map(tokenEntryKey => {
        if (tokenEntryKey === 'address') {
          return (
            include &&
            inputIsAddress &&
            typeof tokenEntry[tokenEntryKey] === 'string' &&
            !!tokenEntry[tokenEntryKey].match(new RegExp(escapeStringRegex(searchQuery), 'i'))
          )
        }
        return (
          include &&
          typeof tokenEntry[tokenEntryKey] === 'string' &&
          !!tokenEntry[tokenEntryKey].match(new RegExp(escapeStringRegex(searchQuery), 'i'))
        )
      })
      return regexMatches.some(m => m)
    })
  }, [tokenList, urlAddedTokens, chainId, showTokenImport, searchQuery])

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

  // sort tokens
  const escapeStringRegexp = string => string

  const sortedPairList = useMemo(() => {
    return Object.keys(allPairs).sort((a, b) => {
      // sort by balance
      const balanceA = allBalances?.[account]?.[a]
      const balanceB = allBalances?.[account]?.[b]

      if (balanceA && !balanceB) {
        return sortDirection
      }
      if (!balanceA && balanceB) {
        return sortDirection * -1
      }
      if (balanceA && balanceB) {
        const order = sortDirection * (parseFloat(balanceA.toExact()) > parseFloat(balanceB.toExact()) ? -1 : 1)
        return order ? 1 : -1
      } else {
        return 0
      }
    })
  }, [account, allBalances, allPairs, sortDirection])

  const filteredPairList = useMemo(() => {
    const isAddress = searchQuery.slice(0, 2) === '0x'
    return sortedPairList.filter(pairAddress => {
      const pair = allPairs[pairAddress]
      if (searchQuery === '') {
        return true
      }
      const token0 = allTokens[pair.token0]
      const token1 = allTokens[pair.token1]
      const regexMatches = Object.keys(token0).map(field => {
        if (
          (field === 'address' && isAddress) ||
          (field === 'name' && !isAddress) ||
          (field === 'symbol' && !isAddress)
        ) {
          return (
            token0[field].match(new RegExp(escapeStringRegexp(searchQuery), 'i')) ||
            token1[field].match(new RegExp(escapeStringRegexp(searchQuery), 'i'))
          )
        }
        return false
      })

      return regexMatches.some(m => m)
    })
  }, [allPairs, allTokens, searchQuery, sortedPairList])

  // update the amount shown as filtered list changes
  useEffect(() => {
    setTokensShown(Math.min(Object.keys(filteredTokenList).length, 3))
  }, [filteredTokenList])
  useEffect(() => {
    setPairsShown(Math.min(Object.keys(filteredPairList).length, 3))
  }, [filteredPairList])

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
      filteredPairList.map((pairAddress, i) => {
        const token0 = allTokens[allPairs[pairAddress].token0]
        const token1 = allTokens[allPairs[pairAddress].token1]
        const balance = allBalances?.[account]?.[pairAddress]?.toSignificant(6)
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
            <Text fontWeight={500} fontSize={16}>
              {balance ? balance.toString() : '-'}
            </Text>
          </MenuItem>
        )
      })
    )
  }

  function renderTokenList() {
    if (isAddress(searchQuery) && tokenAddress === undefined) {
      return <Text>Searching for Exchange...</Text>
    }
    if (isAddress(searchQuery) && tokenAddress === ethers.constants.AddressZero) {
      return (
        <>
          <TokenModalInfo>{t('noToken')}</TokenModalInfo>
          <TokenModalInfo>
            <Link to={`/create-exchange/${searchQuery}`}>{t('createExchange')}</Link>
          </TokenModalInfo>
        </>
      )
    }

    if (!filteredTokenList.length) {
      return <TokenModalInfo>{t('noToken')}</TokenModalInfo>
    }

    return filteredTokenList.map(({ address, symbol, balance }) => {
      const urlAdded = urlAddedTokens && urlAddedTokens.hasOwnProperty(address)
      const customAdded =
        address !== 'ETH' &&
        INITIAL_TOKENS_CONTEXT[chainId] &&
        !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(address) &&
        !urlAdded

      const zeroBalance = balance && JSBI.equal(JSBI.BigInt(0), balance.raw)

      // if token import page dont show preset list, else show all
      return (
        <MenuItem
          key={address}
          onClick={() => (hiddenToken && hiddenToken === address ? () => {} : _onTokenSelect(address))}
          disabled={hiddenToken && hiddenToken === address}
        >
          <RowFixed>
            <TokenLogo address={address} size={'24px'} style={{ marginRight: '14px' }} />
            <Column>
              <Text fontWeight={500}>{symbol}</Text>
              <FadedSpan>
                {urlAdded && '(Added by URL)'} {customAdded && '(Added by user)'}
              </FadedSpan>
            </Column>
          </RowFixed>
          <AutoColumn gap="4px" justify="end">
            {balance ? (
              <Text>
                {zeroBalance && showSendWithSwap ? (
                  <ColumnCenter
                    justify="center"
                    style={{ backgroundColor: '#EBF4FF', padding: '8px', borderRadius: '12px' }}
                  >
                    <Text textAlign="center" fontWeight={500} color="#2172E5">
                      Send With Swap
                    </Text>
                  </ColumnCenter>
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

  const Filter = ({ title, filter }) => {
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
        {filter === activeFilter && (
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
      minHeight={60}
      maxHeight={50}
      initialFocusRef={isMobile ? undefined : inputRef}
    >
      <TokenModal>
        {showTokenImport ? (
          <PaddedColumn gap="20px">
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
            <TYPE.body style={{ marginTop: '40px' }}>
              To import a custom token, paste the token address in the search bar.
            </TYPE.body>
            <Input
              type={'text'}
              placeholder={t('tokenSearchPlaceholder')}
              value={searchQuery}
              ref={inputRef}
              onChange={onInput}
            />
            <LightCard padding={filteredTokenList?.length === 0 ? '20px' : '0px'}>
              {filteredTokenList?.length === 0 ? (
                <AutoColumn gap="8px" justify="center">
                  <TYPE.body color="">No token found.</TYPE.body>
                </AutoColumn>
              ) : (
                renderTokenList()
              )}
            </LightCard>
            {filteredTokenList?.length > 0 && (
              <RowBetween>
                <ButtonSecondary
                  width="48%"
                  onClick={() => {
                    const newToken = filteredTokenList?.[0]
                    saveUserToken(newToken?.address)
                  }}
                >
                  Save To Your List
                </ButtonSecondary>
                <ButtonSecondary width="48%" onClick={() => _onTokenSelect(filteredTokenList[0].address)}>
                  Import
                </ButtonSecondary>
              </RowBetween>
            )}
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
              placeholder={t('tokenSearchPlaceholder')}
              value={searchQuery}
              ref={inputRef}
              onChange={onInput}
            />
            <RowBetween>
              <div>
                {filterType !== 'tokens' && (
                  <Text fontWeight={500}>
                    {!isMobile && 'Dont see a pool? '}
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
                  <Text fontWeight={500}>
                    {!isMobile && 'Dont see a token? '}
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
              <div />
              <Filter title="Your Balances" filter={FILTERS.BALANCES} />
            </RowBetween>
          </PaddedColumn>
        )}
        {!showTokenImport && <div style={{ width: '100%', height: '1px', backgroundColor: '#E1E1E1' }} />}
        {!showTokenImport && <TokenList>{filterType === 'tokens' ? renderTokenList() : renderPairsList()}</TokenList>}
      </TokenModal>
    </Modal>
  )
}

export default withRouter(SearchModal)
