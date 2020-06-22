import { Pair } from '@uniswap/sdk'
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { useTranslation } from 'react-i18next'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import Card from '../../components/Card'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens } from '../../hooks/Tokens'
import { useAllDummyPairs } from '../../state/user/hooks'
import { useTokenBalances } from '../../state/wallet/hooks'
import { CloseIcon, StyledInternalLink } from '../../theme/components'
import { isAddress } from '../../utils'
import Column from '../Column'
import Modal from '../Modal'
import QuestionHelper from '../QuestionHelper'
import { AutoRow, RowBetween } from '../Row'
import { filterPairs } from './filtering'
import PairList from './PairList'
import { pairComparator } from './sorting'
import { PaddedColumn, SearchInput } from './styleds'

interface PairSearchModalProps extends RouteComponentProps {
  isOpen?: boolean
  onDismiss?: () => void
}

function PairSearchModal({ history, isOpen, onDismiss }: PairSearchModalProps) {
  const { t } = useTranslation()
  const { account } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const [searchQuery, setSearchQuery] = useState<string>('')

  const allTokens = useAllTokens()
  const allPairs = useAllDummyPairs()

  const allPairBalances = useTokenBalances(
    account,
    allPairs.map(p => p.liquidityToken)
  )

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

  const filteredPairs = useMemo(() => {
    return filterPairs(allPairs, searchQuery)
  }, [allPairs, searchQuery])

  const sortedPairList = useMemo(() => {
    const query = searchQuery.toLowerCase()
    const queryMatches = (pair: Pair): boolean =>
      pair.token0.symbol.toLowerCase() === query || pair.token1.symbol.toLowerCase() === query
    return filteredPairs.sort((a, b): number => {
      const [aMatches, bMatches] = [queryMatches(a), queryMatches(b)]
      if (aMatches && !bMatches) return -1
      if (bMatches && !aMatches) return 1
      const balanceA = allPairBalances[a.liquidityToken.address]
      const balanceB = allPairBalances[b.liquidityToken.address]
      return pairComparator(a, b, balanceA, balanceB)
    })
  }, [searchQuery, filteredPairs, allPairBalances])

  const selectPair = useCallback(
    (pair: Pair) => {
      history.push(`/add/${pair.token0.address}-${pair.token1.address}`)
    },
    [history]
  )

  const focusedToken = Object.values(allTokens ?? {}).filter(token => {
    return token.symbol.toLowerCase() === searchQuery || searchQuery === token.address
  })[0]

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onDismiss}
      maxHeight={70}
      initialFocusRef={isMobile ? undefined : inputRef}
      minHeight={70}
    >
      <Column style={{ width: '100%' }}>
        <PaddedColumn gap="20px">
          <RowBetween>
            <Text fontWeight={500} fontSize={16}>
              Select a pool
              <QuestionHelper text="Find a pair by searching for its name below." />
            </Text>
            <CloseIcon onClick={onDismiss} />
          </RowBetween>
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder={t('tokenSearchPlaceholder')}
            value={searchQuery}
            ref={inputRef}
            onChange={onInput}
          />
          <RowBetween>
            <Text fontSize={14} fontWeight={500}>
              Pool Name
            </Text>
          </RowBetween>
        </PaddedColumn>
        <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />
        <PairList
          pairs={sortedPairList}
          focusTokenAddress={focusedToken?.address}
          onAddLiquidity={selectPair}
          onSelectPair={selectPair}
          pairBalances={allPairBalances}
        />
        <div style={{ width: '100%', height: '1px', backgroundColor: theme.bg2 }} />
        <Card>
          <AutoRow justify={'center'}>
            <div>
              <Text fontWeight={500}>
                {!isMobile && "Don't see a pool? "}
                <StyledInternalLink to="/find">{!isMobile ? 'Import it.' : 'Import pool.'}</StyledInternalLink>
              </Text>
            </div>
          </AutoRow>
        </Card>
      </Column>
    </Modal>
  )
}

export default withRouter(PairSearchModal)
