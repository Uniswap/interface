import '@reach/tooltip/styles.css'
import { Pair, Token } from '@uniswap/sdk'
import React, { useCallback, useContext, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import Card from '../../components/Card'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useTokenByAddressAndAutomaticallyAdd } from '../../hooks/Tokens'
import { useAllDummyPairs, useRemoveUserAddedToken } from '../../state/user/hooks'
import { useAllTokenBalancesTreatingWETHasETH, useTokenBalances } from '../../state/wallet/hooks'
import { CloseIcon, Link as StyledLink } from '../../theme/components'
import { isAddress } from '../../utils'
import Column from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../Question'
import { AutoRow, RowBetween } from '../Row'
import { CommonBases } from './CommonBases'
import { filterPairs, filterTokens } from './filtering'
import { PairList } from './PairList'
import { balanceComparator, useTokenComparator } from './sorting'
import { Input, PaddedColumn } from './styleds'
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

  const isTokenView = filterType === 'tokens'

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

  const sortedPairList = useMemo(() => {
    if (isTokenView) return []
    return allPairs.sort((a, b): number => {
      // sort by balance
      const balanceA = allPairBalances[account]?.[a.liquidityToken.address]
      const balanceB = allPairBalances[account]?.[b.liquidityToken.address]

      return balanceComparator(balanceA, balanceB)
    })
  }, [isTokenView, allPairs, allPairBalances, account])

  const filteredPairs = useMemo(() => {
    if (isTokenView) return []
    return filterPairs(sortedPairList, searchQuery)
  }, [isTokenView, searchQuery, sortedPairList])

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
              {isTokenView ? 'Select a token' : 'Select a pool'}
              <QuestionHelper
                text={
                  isTokenView
                    ? 'Find a token by searching for its name or symbol or by pasting its address below.'
                    : 'Find a pair by searching for a token below.'
                }
              />
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
            <CommonBases chainId={chainId} onSelect={_onTokenSelect} selectedTokenAddress={hiddenToken} />
          )}
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              {isTokenView ? 'Token Name' : 'Pool Name'}
            </Text>
            {isTokenView && (
              <TokenSortButton
                invertSearchOrder={invertSearchOrder}
                toggleSortOrder={() => setInvertSearchOrder(iso => !iso)}
                title={isTokenView ? 'Your Balances' : ' '}
              />
            )}
          </RowBetween>
        </PaddedColumn>
        <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />
        {isTokenView ? (
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
              {isTokenView && (
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
              {isTokenView && (
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
