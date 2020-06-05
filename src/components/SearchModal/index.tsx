import { Pair, Token } from '@uniswap/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
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
import { CloseIcon, LinkStyledButton, StyledInternalLink } from '../../theme/components'
import { isAddress } from '../../utils'
import Column from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween } from '../Row'
import Tooltip from '../Tooltip'
import CommonBases from './CommonBases'
import { filterPairs, filterTokens } from './filtering'
import PairList from './PairList'
import { useTokenComparator, pairComparator } from './sorting'
import { PaddedColumn, SearchInput } from './styleds'
import TokenList from './TokenList'
import SortButton from './SortButton'

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
  const allTokenBalances = useAllTokenBalancesTreatingWETHasETH() ?? {}
  const allPairBalances = useTokenBalances(
    account,
    allPairs.map(p => p.liquidityToken)
  )

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [tooltipOpen, setTooltipOpen] = useState<boolean>(false)
  const [invertSearchOrder, setInvertSearchOrder] = useState<boolean>(false)

  const removeTokenByAddress = useRemoveUserAddedToken()

  // if the current input is an address, and we don't have the token in context, try to fetch it and import
  useTokenByAddressAndAutomaticallyAdd(searchQuery)

  const tokenComparator = useTokenComparator(invertSearchOrder)

  const filteredTokens: Token[] = useMemo(() => {
    if (!isTokenView) return []
    return filterTokens(Object.values(allTokens), searchQuery)
  }, [isTokenView, allTokens, searchQuery])

  const filteredSortedTokens: Token[] = useMemo(() => {
    if (!isTokenView) return []
    const sorted = filteredTokens.sort(tokenComparator)
    const symbolMatch = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(s => s.length > 0)
    if (symbolMatch.length > 1) return sorted

    return [
      // sort any exact symbol matches first
      ...sorted.filter(token => token.symbol.toLowerCase() === symbolMatch[0]),
      ...sorted.filter(token => token.symbol.toLowerCase() !== symbolMatch[0])
    ]
  }, [filteredTokens, isTokenView, searchQuery, tokenComparator])

  function _onTokenSelect(address: string) {
    onTokenSelect(address)
    onDismiss()
  }

  // clear the input on open
  useEffect(() => {
    if (isOpen) setSearchQuery('')
  }, [isOpen, setSearchQuery])

  // manage focus on modal show
  const inputRef = useRef<HTMLInputElement>()
  function onInput(event) {
    const input = event.target.value
    const checksummedInput = isAddress(input)
    setSearchQuery(checksummedInput || input)
  }

  const sortedPairList = useMemo(() => {
    if (isTokenView) return []
    return allPairs.sort((a, b): number => {
      const balanceA = allPairBalances[a.liquidityToken.address]
      const balanceB = allPairBalances[b.liquidityToken.address]
      return pairComparator(a, b, balanceA, balanceB)
    })
  }, [isTokenView, allPairs, allPairBalances])

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

  const focusedToken = Object.values(allTokens ?? {}).filter(token => {
    return token.symbol.toLowerCase() === searchQuery || searchQuery === token.address
  })[0]

  const openTooltip = useCallback(() => {
    setTooltipOpen(true)
    inputRef.current?.focus()
  }, [setTooltipOpen])
  const closeTooltip = useCallback(() => setTooltipOpen(false), [setTooltipOpen])

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={70} initialFocusRef={isMobile ? undefined : inputRef}>
      <Column style={{ width: '100%' }}>
        <PaddedColumn gap="20px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              {isTokenView ? 'Select a token' : 'Select a pool'}
              <QuestionHelper
                disabled={tooltipOpen}
                text={
                  isTokenView
                    ? 'Find a token by searching for its name or symbol or by pasting its address below.'
                    : 'Find a pair by searching for its name below.'
                }
              />
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <Tooltip
            text="Import any token into your list by pasting the token address into the search field."
            show={tooltipOpen}
            placement="bottom"
          >
            <SearchInput
              type="text"
              id="token-search-input"
              placeholder={t('tokenSearchPlaceholder')}
              value={searchQuery}
              ref={inputRef}
              onChange={onInput}
              onBlur={closeTooltip}
            />
          </Tooltip>
          {showCommonBases && (
            <CommonBases chainId={chainId} onSelect={_onTokenSelect} selectedTokenAddress={hiddenToken} />
          )}
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              {isTokenView ? 'Token Name' : 'Pool Name'}
            </Text>
            {isTokenView && (
              <SortButton ascending={invertSearchOrder} toggleSortOrder={() => setInvertSearchOrder(iso => !iso)} />
            )}
          </RowBetween>
        </PaddedColumn>
        <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />
        {isTokenView ? (
          <TokenList
            tokens={filteredSortedTokens}
            allTokenBalances={allTokenBalances}
            onRemoveAddedToken={removeTokenByAddress}
            onTokenSelect={_onTokenSelect}
            otherSelectedText={otherSelectedText}
            otherToken={otherSelectedTokenAddress}
            selectedToken={hiddenToken}
            showSendWithSwap={showSendWithSwap}
            hideRemove={Boolean(isAddress(searchQuery))}
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
              {isTokenView ? (
                <LinkStyledButton style={{ fontWeight: 500, color: theme.text2, fontSize: 16 }} onClick={openTooltip}>
                  Having trouble finding a token?
                </LinkStyledButton>
              ) : (
                <Text fontWeight={500}>
                  {!isMobile && "Don't see a pool? "}
                  <StyledInternalLink to="/find">{!isMobile ? 'Import it.' : 'Import pool.'}</StyledInternalLink>
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
