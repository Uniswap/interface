import React, { useState, useRef, useMemo, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Link as StyledLink } from '../../theme/components'
import { useTranslation } from 'react-i18next'
import { ethers } from 'ethers'
import styled from 'styled-components'
import escapeStringRegex from 'escape-string-regexp'
import '@reach/tooltip/styles.css'
import { isMobile } from 'react-device-detect'

import { Text } from 'rebass'
import Column, { AutoColumn } from '../Column'
import { RowBetween, RowFixed } from '../Row'
import TokenLogo from '../TokenLogo'
import { CloseIcon } from '../../theme/components'
import DoubleTokenLogo from '../DoubleLogo'
import { useWeb3React } from '../../hooks'
import { isAddress } from '../../utils'
import Modal from '../Modal'
import { useToken, useAllTokens, INITIAL_TOKENS_CONTEXT } from '../../contexts/Tokens'
import { Spinner } from '../../theme'
import Circle from '../../assets/images/circle.svg'
import { useAllBalances } from '../../contexts/Balances'
import { useAllExchanges } from '../../contexts/Exchanges'

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
  color: ${({ theme }) => theme.royalBlue};
`

const SpinnerWrapper = styled(Spinner)`
  margin: 0 0.25rem 0 0.25rem;
  color: ${({ theme }) => theme.chaliceGray};
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
  color: ${({ theme }) => theme.textColor};
  font-size: 18px;

  ::placeholder {
    color: ${({ theme }) => theme.fadedText};
  }
`

const TokenModal = styled.div`
  ${({ theme }) => theme.flexColumnNoWrap}
  width: 100%;
`

const FilterWrapper = styled(RowFixed)`
  padding: 8px;
  background-color: ${({ selected, theme }) => selected && theme.backgroundColor};
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
  width: calc(100% - 48px);
  height: 56px;
`

const MenuItem = styled(PaddedItem)`
  cursor: pointer;

  :hover {
    background-color: ${({ theme }) => theme.tokenRowHover};
  }
`
function SearchModal({ history, isOpen, onDismiss, onTokenSelect, urlAddedTokens, filterType, hiddenToken }) {
  const { t } = useTranslation()

  const { account, chainId } = useWeb3React()

  const [searchQuery, setSearchQuery] = useState('')

  // get all exchanges
  const allExchanges = useAllExchanges()
  const token = useToken(searchQuery)

  const tokenAddress = token && token.address

  // get all tokens
  const allTokens = useAllTokens()

  // all balances for both account and exchanges
  let allBalances = useAllBalances()

  const [sortDirection, setSortDirection] = useState(true)

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

          // sort alphabetically
          return aSymbol < bSymbol ? -1 : aSymbol > bSymbol ? 1 : 0
        } else {
          return 0
        }
      })
      .map(k => {
        if (k === hiddenToken) {
          return false
        }

        let balance
        // only update if we have data
        balance = allBalances?.[account]?.[k]
        return {
          name: allTokens[k].name,
          symbol: allTokens[k].symbol,
          address: k,
          balance: balance
        }
      })
  }, [allTokens, allBalances, account, sortDirection, hiddenToken])

  const filteredTokenList = useMemo(() => {
    return tokenList.filter(tokenEntry => {
      const inputIsAddress = searchQuery.slice(0, 2) === '0x'

      // check the regex for each field
      const regexMatches = Object.keys(tokenEntry).map(tokenEntryKey => {
        // if address field only search if input starts with 0x
        if (tokenEntryKey === 'address') {
          return (
            inputIsAddress &&
            typeof tokenEntry[tokenEntryKey] === 'string' &&
            !!tokenEntry[tokenEntryKey].match(new RegExp(escapeStringRegex(searchQuery), 'i'))
          )
        }
        return (
          typeof tokenEntry[tokenEntryKey] === 'string' &&
          !!tokenEntry[tokenEntryKey].match(new RegExp(escapeStringRegex(searchQuery), 'i'))
        )
      })
      return regexMatches.some(m => m)
    })
  }, [tokenList, searchQuery])

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

  // amount of tokens to display at once
  const [, setTokensShown] = useState(0)
  const [, setPairsShown] = useState(0)

  // filters on results
  const FILTERS = {
    VOLUME: 'VOLUME',
    LIQUIDITY: 'LIQUIDITY',
    BALANCES: 'BALANCES'
  }
  const [activeFilter, setActiveFilter] = useState(FILTERS.BALANCES)

  // sort tokens
  const escapeStringRegexp = string => string

  // sort pairs
  const filteredPairList = useMemo(() => {
    // check if the search is an address
    const isAddress = searchQuery.slice(0, 2) === '0x'
    return Object.keys(allExchanges).filter(exchangeAddress => {
      const exchange = allExchanges[exchangeAddress]

      if (searchQuery === '') {
        return true
      }
      const token0 = allTokens[exchange.token0]
      const token1 = allTokens[exchange.token1]

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
  }, [allExchanges, allTokens, searchQuery])

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
      filteredPairList.map((exchangeAddress, i) => {
        const token0 = allTokens[allExchanges[exchangeAddress].token0]
        const token1 = allTokens[allExchanges[exchangeAddress].token1]

        const balance = allBalances?.[account]?.[exchangeAddress]?.toSignificant(6)

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
          <TokenModalInfo>{t('noExchange')}</TokenModalInfo>
          <TokenModalInfo>
            <Link to={`/create-exchange/${searchQuery}`}>{t('createExchange')}</Link>
          </TokenModalInfo>
        </>
      )
    }
    if (!filteredTokenList.length) {
      return <TokenModalInfo>{t('noExchange')}</TokenModalInfo>
    }

    return filteredTokenList.map(({ address, symbol, balance }) => {
      const urlAdded = urlAddedTokens && urlAddedTokens.hasOwnProperty(address)
      const customAdded =
        address !== 'ETH' &&
        INITIAL_TOKENS_CONTEXT[chainId] &&
        !INITIAL_TOKENS_CONTEXT[chainId].hasOwnProperty(address) &&
        !urlAdded
      return (
        <MenuItem key={address} onClick={() => _onTokenSelect(address)}>
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
              <Text>{balance ? balance.toSignificant(6) : '-'}</Text>
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
        <PaddedColumn gap="20px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              {filterType === 'tokens' ? 'Select A Token' : 'Select A Pool'}
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <Input
            type={'text'}
            placeholder={'Search name or address'}
            value={searchQuery}
            ref={inputRef}
            onChange={onInput}
          />
          <RowBetween>
            <div>
              <Text>
                Don't see a pool?{' '}
                <StyledLink
                  onClick={() => {
                    history.push('/find')
                  }}
                >
                  Import it.
                </StyledLink>
              </Text>
            </div>
            <div />
            <Filter title="Your Balances" filter={FILTERS.BALANCES} />
          </RowBetween>
        </PaddedColumn>
        <div style={{ width: '100%', height: '1px', backgroundColor: '#E1E1E1' }} />
        <TokenList>{filterType === 'tokens' ? renderTokenList() : renderPairsList()}</TokenList>
      </TokenModal>
    </Modal>
  )
}

export default withRouter(SearchModal)
