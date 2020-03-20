import React, { useState } from 'react'
import { withRouter } from 'react-router-dom'
import { TokenAmount, JSBI, Token, Exchange } from '@uniswap/sdk'

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
import { useExchange } from '../../contexts/Exchanges'
import { useWeb3React } from '@web3-react/core'
import { useAddressBalance } from '../../contexts/Balances'

function PoolFinder({ history }) {
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

  const exchange: Exchange = useExchange(token0, token1)
  const position: TokenAmount = useAddressBalance(account, exchange?.liquidityToken)

  const newExchange: boolean = exchange && JSBI.equal(exchange.reserve0.raw, JSBI.BigInt(0))
  const allowImport: boolean = position && JSBI.greaterThan(position.raw, JSBI.BigInt(0))

  function endSearch() {
    history.goBack() // return to previous page
    addPopup(
      <Row>
        <DoubleTokenLogo a0={token0Address || ''} a1={token1Address || ''} margin={true} />
        <Text color="grey">
          UNI {token0?.symbol} / {token1?.symbol} pool imported.
        </Text>
      </Row>
    )
  }

  return (
    <>
      <AutoColumn gap="24px">
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
          <ColumnCenter justify="center" style={{ backgroundColor: '#EBF4FF', padding: '8px', borderRadius: '12px' }}>
            <Text textAlign="center" fontWeight={500} color="#2172E5">
              Liquidity Found!
            </Text>
          </ColumnCenter>
        )}
        {position ? (
          !JSBI.equal(position.raw, JSBI.BigInt(0)) ? (
            <PositionCard
              exchangeAddress={exchange?.liquidityToken.address}
              token0={token0}
              token1={token1}
              minimal={true}
              border="1px solid #EDEEF2"
            />
          ) : (
            <LightCard padding="45px">
              <AutoColumn gap="8px" justify="center">
                <Text color="">No position found.</Text>
                <Link
                  onClick={() => {
                    history.push('/add/' + token0Address + '-' + token1Address)
                  }}
                >
                  Add liquidity to this pair instead.
                </Link>
              </AutoColumn>
            </LightCard>
          )
        ) : newExchange ? (
          <LightCard padding="45px">
            <AutoColumn gap="8px" justify="center">
              <Text color="">No exchange found.</Text>
              <Link
                onClick={() => {
                  history.push('/add/' + token0Address + '-' + token1Address)
                }}
              >
                Create exchange instead.
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
            Import
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
