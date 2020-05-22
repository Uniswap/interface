import '@reach/tooltip/styles.css'
import { JSBI, Pair, Token, TokenAmount } from '@uniswap/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { FixedSizeList } from 'react-window'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import Card from '../../components/Card'
import { COMMON_BASES } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useAllDummyPairs, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useAllTokenBalancesTreatingWETHasETH, useTokenBalances } from '../../state/wallet/hooks'
import { CloseIcon, Link as StyledLink } from '../../theme/components'
import { isAddress } from '../../utils'
import { ButtonPrimary } from '../Button'
import Column, { AutoColumn } from '../Column'
import DoubleTokenLogo from '../DoubleLogo'
import Modal from '../Modal'
import QuestionHelper from '../Question'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import TokenLogo from '../TokenLogo'
import { filterPairs, filterTokens } from './filtering'
import { balanceComparator, useTokenComparator } from './sorting'
import { BaseWrapper, Input, MenuItem, PaddedColumn } from './styleds'
import { TokenList } from './TokenList'
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

function PairList({
  pairs,
  focusTokenAddress,
  pairBalances,
  onSelectPair,
  onAddLiquidity = onSelectPair
}: {
  pairs: Pair[]
  focusTokenAddress?: string
  pairBalances: { [pairAddress: string]: TokenAmount }
  onSelectPair: (pair: Pair) => void
  onAddLiquidity: (pair: Pair) => void
}) {
  if (pairs.length === 0) {
    return (
      <PaddedColumn justify="center">
        <Text>No Pools Found</Text>
      </PaddedColumn>
    )
  }

  return (
    <FixedSizeList itemSize={54} height={254} itemCount={pairs.length} width="100%">
      {({ index, style }) => {
        const pair = pairs[index]

        // reset ordering to help scan search results
        const tokenA = focusTokenAddress === pair.token1.address ? pair.token1 : pair.token0
        const tokenB = tokenA === pair.token0 ? pair.token1 : pair.token0

        const pairAddress = pair.liquidityToken.address
        const balance = pairBalances[pairAddress]?.toSignificant(6)
        const zeroBalance = pairBalances[pairAddress]?.raw && JSBI.equal(pairBalances[pairAddress].raw, JSBI.BigInt(0))

        const selectPair = () => onSelectPair(pair)
        const addLiquidity = () => onAddLiquidity(pair)

        return (
          <MenuItem style={style} onClick={selectPair}>
            <RowFixed>
              <DoubleTokenLogo a0={tokenA.address} a1={tokenB.address} size={24} margin={true} />
              <Text fontWeight={500} fontSize={16}>{`${tokenA.symbol}/${tokenB.symbol}`}</Text>
            </RowFixed>

            <ButtonPrimary padding={'6px 8px'} width={'fit-content'} borderRadius={'12px'} onClick={addLiquidity}>
              {balance ? (zeroBalance ? 'Join' : 'Add Liquidity') : 'Join'}
            </ButtonPrimary>
          </MenuItem>
        )
      }}
    </FixedSizeList>
  )
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
  const allTokenBalances = useAllTokenBalancesTreatingWETHasETH()[account] ?? {}
  const allPairBalances =
    useTokenBalances(
      account,
      allPairs.map(p => p.liquidityToken)
    )[account] ?? {}

  const [searchQuery, setSearchQuery] = useState('')
  const [invertSearchOrder, setInvertSearchOrder] = useState(false)

  const removeTokenByAddress = useRemoveUserAddedToken()

  // if the current input is an address, and we don't have the token in context, try to fetch it
  useTokenByAddressAndAutomaticallyAdd(searchQuery)

  // used to help scanning on results, put token found from input on left
  const [identifiedToken, setIdentifiedToken] = useState<Token>()

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const sortedTokens: Token[] = useMemo(() => {
    return Object.values(allTokens).sort(tokenComparator)
  }, [allTokens, tokenComparator])

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(sortedTokens, searchQuery)
  }, [sortedTokens, searchQuery])

  function _onTokenSelect(address: string) {
    setSearchQuery('')
    onTokenSelect(address)
    onDismiss()
  }

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
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
    if (filterType === 'tokens') return []
    return allPairs.sort((a, b): number => {
      // sort by balance
      const balanceA = allPairBalances[account]?.[a.liquidityToken.address]
      const balanceB = allPairBalances[account]?.[b.liquidityToken.address]

      return balanceComparator(balanceA, balanceB)
    })
  }, [filterType, allPairs, allPairBalances, account])

  const filteredPairs = useMemo(() => {
    if (filterType === 'tokens') return []
    return filterPairs(sortedPairList, searchQuery)
  }, [filterType, searchQuery, sortedPairList])

  const selectPair = useCallback(
    (pair: Pair) => {
      history.push(`/add/${pair.token0.address}-${pair.token1.address}`)
    },
    [history]
  )

  const focusedToken = filteredTokens.filter(token => {
    return token.symbol.toLowerCase() === searchQuery || searchQuery === token.address
  })[0]

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={clearInputAndDismiss}
      maxHeight={70}
      initialFocusRef={isMobile ? undefined : inputRef}
    >
      <Column style={{ width: '100%' }}>
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
        <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />
        {filterType === 'tokens' ? (
          <TokenList
            tokens={filteredTokens}
            allTokenBalances={allTokenBalances}
            onRemoveAddedToken={removeTokenByAddress}
            onTokenSelect={_onTokenSelect}
            otherSelectedText={otherSelectedText}
            otherToken={otherSelectedTokenAddress}
            selectedToken={hiddenToken}
            showSendWithSwap={showSendWithSwap}
          />
        ) : (
          <PairList
            pairs={filteredPairs}
            focusTokenAddress={focusedToken?.address}
            onAddLiquidity={selectPair}
            onSelectPair={selectPair}
            pairBalances={allPairBalances}
          />
        )}
        <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />
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
                      setSearchQuery('')
                      inputRef.current?.focus()
                    }}
                  >
                    {!isMobile ? 'Import it.' : 'Import custom token.'}
                  </StyledLink>
                </Text>
              )}
            </div>
          </AutoRow>
        </Card>
      </Column>
    </Modal>
  )
}

export default withRouter(SearchModal)
