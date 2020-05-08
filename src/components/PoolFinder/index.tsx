import React, { useState, useEffect } from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { TokenAmount, JSBI, Token, Pair } from '@uniswap/sdk'

import Row from '../Row'
import TokenLogo from '../TokenLogo'
import SearchModal from '../SearchModal'
import PositionCard from '../PositionCard'
import DoubleTokenLogo from '../DoubleLogo'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { Plus } from 'react-feather'
import { LightCard } from '../Card'
import { AutoColumn, ColumnCenter } from '../Column'
import { ButtonPrimary, ButtonDropwdown, ButtonDropwdownLight } from '../Button'

import { useToken } from '../../contexts/Tokens'
import { usePopups } from '../../contexts/Application'
import { usePrevious } from '../../hooks'
import { useWeb3React } from '@web3-react/core'
import { useAddressBalance } from '../../contexts/Balances'
import { usePair, useAllPairs } from '../../contexts/Pairs'

function PoolFinder({ history }: RouteComponentProps) {
  const Fields = {
    TOKEN0: 0,
    TOKEN1: 1
  }

  const { account } = useWeb3React()
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN0)

  const [, addPopup] = usePopups()

  const [token0Address, setToken0Address] = useState<string>()
  const [token1Address, setToken1Address] = useState<string>()

  const token0: Token = useToken(token0Address)
  const token1: Token = useToken(token1Address)

  const pair: Pair = usePair(token0, token1)
  const position: TokenAmount = useAddressBalance(account, pair?.liquidityToken)

  const newPair: boolean = pair && JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0))
  const allowImport: boolean = position && JSBI.greaterThan(position.raw, JSBI.BigInt(0))

  const allPairs = useAllPairs()
  const pairCount = Object.keys(allPairs)?.length
  const pairCountPrevious = usePrevious(pairCount)
  const [newLiquidity, setNewLiquidity] = useState<boolean>(false) // check for unimported pair

  // use previous ref to detect new pair added
  useEffect(() => {
    if (pairCount !== pairCountPrevious && pairCountPrevious) {
      setNewLiquidity(true)
    }
  }, [pairCount, pairCountPrevious])

  // reset the watcher if tokens change
  useEffect(() => {
    setNewLiquidity(false)
  }, [token0, token1])

  function endSearch() {
    history.goBack() // return to previous page
    newLiquidity &&
      addPopup(
        <AutoColumn gap={'10px'}>
          <Text fontSize={20} fontWeight={500}>
            Pool Imported
          </Text>
          <Row>
            <DoubleTokenLogo a0={token0Address || ''} a1={token1Address || ''} margin={true} />
            <Text fontSize={16} fotnWeight={500}>
              UNI {token0?.symbol} / {token1?.symbol}
            </Text>
          </Row>
          <Link>View on Uniswap Info.</Link>
        </AutoColumn>
      )
  }

  return (
    <>
      <AutoColumn gap="md">
        {!token0Address ? (
          <ButtonDropwdown
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN0)
            }}
          >
            <Text fontSize={20}>Select first token</Text>
          </ButtonDropwdown>
        ) : (
          <ButtonDropwdownLight
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN0)
            }}
          >
            <Row>
              <TokenLogo address={token0Address} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {token0?.symbol}
              </Text>
            </Row>
          </ButtonDropwdownLight>
        )}
        <ColumnCenter>
          <Plus size="16" color="#888D9B" />
        </ColumnCenter>
        {!token1Address ? (
          <ButtonDropwdown
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN1)
            }}
          >
            <Text fontSize={20}>Select second token</Text>
          </ButtonDropwdown>
        ) : (
          <ButtonDropwdownLight
            onClick={() => {
              setShowSearch(true)
              setActiveField(Fields.TOKEN1)
            }}
          >
            <Row>
              <TokenLogo address={token1Address} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {token1?.symbol}
              </Text>
            </Row>
          </ButtonDropwdownLight>
        )}
        {allowImport && (
          <ColumnCenter
            style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
          >
            <Text textAlign="center" fontWeight={500} color="">
              {newLiquidity ? 'Pool Found!' : 'Pool already imported.'}
            </Text>
          </ColumnCenter>
        )}
        {position ? (
          !JSBI.equal(position.raw, JSBI.BigInt(0)) ? (
            <PositionCard
              pairAddress={pair?.liquidityToken.address}
              token0={token0}
              token1={token1}
              minimal={true}
              border="1px solid #EDEEF2"
            />
          ) : (
            <LightCard padding="45px 10px">
              <AutoColumn gap="sm" justify="center">
                <Text textAlign="center">Pool found, you don’t have liquidity on this pair yet.</Text>
                <Link
                  onClick={() => {
                    history.push('/add/' + token0Address + '-' + token1Address)
                  }}
                >
                  <Text textAlign="center">Add liquidity to this pair instead.</Text>
                </Link>
              </AutoColumn>
            </LightCard>
          )
        ) : newPair ? (
          <LightCard padding="45px">
            <AutoColumn gap="sm" justify="center">
              <Text color="">No pool found.</Text>
              <Link
                onClick={() => {
                  history.push('/add/' + token0Address + '-' + token1Address)
                }}
              >
                Create pool instead.
              </Link>
            </AutoColumn>
          </LightCard>
        ) : (
          <LightCard bg="rgba(255, 255, 255, 0.6)" padding={'45px'}>
            <Text color="#C3C5CB" textAlign="center">
              Select a token pair to find your liquidity.
            </Text>
          </LightCard>
        )}

        <ButtonPrimary disabled={!allowImport} onClick={endSearch}>
          <Text fontWeight={500} fontSize={20}>
            {newLiquidity ? 'Import' : 'Close'}
          </Text>
        </ButtonPrimary>
      </AutoColumn>
      <SearchModal
        isOpen={showSearch}
        filterType="tokens"
        onTokenSelect={address => {
          activeField === Fields.TOKEN0 ? setToken0Address(address) : setToken1Address(address)
        }}
        onDismiss={() => {
          setShowSearch(false)
        }}
        hiddenToken={activeField === Fields.TOKEN0 ? token1Address : token0Address}
      />
    </>
  )
}

export default withRouter(PoolFinder)
