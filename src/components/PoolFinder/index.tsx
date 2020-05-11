import React, { useState, useEffect } from 'react'
import { RouteComponentProps, withRouter } from 'react-router-dom'
import { TokenAmount, JSBI, Token, Pair } from '@uniswap/sdk'

import Row from '../Row'
import TokenLogo from '../TokenLogo'
import SearchModal from '../SearchModal'
import PositionCard from '../PositionCard'
import { Link } from '../../theme'
import { Text } from 'rebass'
import { Plus } from 'react-feather'
import { LightCard } from '../Card'
import { AutoColumn, ColumnCenter } from '../Column'
import { ButtonPrimary, ButtonDropwdown, ButtonDropwdownLight } from '../Button'

import { useToken } from '../../contexts/Tokens'
import { useWeb3React } from '@web3-react/core'
import { useAddressBalance } from '../../contexts/Balances'
import { useLocalStoragePairAdder } from '../../contexts/LocalStorage'
import { usePair } from '../../data/Reserves'

const Fields = {
  TOKEN0: 0,
  TOKEN1: 1
}

function PoolFinder({ history }: RouteComponentProps) {
  const { account } = useWeb3React()
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN0)

  const [token0Address, setToken0Address] = useState<string>()
  const [token1Address, setToken1Address] = useState<string>()
  const token0: Token = useToken(token0Address)
  const token1: Token = useToken(token1Address)

  const pair: Pair = usePair(token0, token1)
  const addPair = useLocalStoragePairAdder()

  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const position: TokenAmount = useAddressBalance(account, pair?.liquidityToken)

  const newPair: boolean =
    !!pair && JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) && JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))
  const allowImport: boolean = position && JSBI.greaterThan(position.raw, JSBI.BigInt(0))

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
              Pool Imported!
            </Text>
          </ColumnCenter>
        )}
        {position ? (
          !JSBI.equal(position.raw, JSBI.BigInt(0)) ? (
            <PositionCard pair={pair} minimal={true} border="1px solid #CED0D9" />
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
                Create pool?
              </Link>
            </AutoColumn>
          </LightCard>
        ) : (
          <LightCard padding={'45px'}>
            <Text color="#C3C5CB" textAlign="center">
              Select a token pair to find your liquidity.
            </Text>
          </LightCard>
        )}

        <ButtonPrimary disabled={!allowImport} onClick={() => history.goBack()}>
          <Text fontWeight={500} fontSize={20}>
            Close
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
