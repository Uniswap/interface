import React, { useState, useEffect } from 'react'
import { withRouter } from 'react-router-dom'
import { Token, JSBI, WETH } from '@uniswap/sdk'

import Row, { AutoRow } from '../Row'
import TokenLogo from '../TokenLogo'
import SearchModal from '../SearchModal'
import AddLiquidity from '../../pages/Supply/AddLiquidity'
import { Text } from 'rebass'
import { Plus } from 'react-feather'
import { TYPE, Link } from '../../theme'
import { AutoColumn, ColumnCenter } from '../Column'
import { ButtonPrimary, ButtonDropwdown, ButtonDropwdownLight } from '../Button'

import { usePair } from '../../contexts/Pairs'
import { useToken } from '../../contexts/Tokens'
import { useWeb3React } from '../../hooks'

const Fields = {
  TOKEN0: 0,
  TOKEN1: 1
}

function CreatePool({ history }) {
  const { chainId } = useWeb3React()
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN0)

  const [token0Address, setToken0Address] = useState<string>(WETH[chainId].address)
  const [token1Address, setToken1Address] = useState<string>()

  const token0: Token = useToken(token0Address)
  const token1: Token = useToken(token1Address)

  const [step, setStep] = useState<number>(1)

  const pair = usePair(token0, token1)
  const pairExists = // used to detect new exchange
    pair && JSBI.notEqual(pair.reserve0.raw, JSBI.BigInt(0)) && JSBI.notEqual(pair.reserve1.raw, JSBI.BigInt(0))

  useEffect(() => {
    if (token0Address && token1Address && pair && !pairExists) {
      setStep(2)
    }
  }, [pair, pairExists, token0Address, token1Address])

  if (step === 2 && !pairExists) {
    return <AddLiquidity token0={token0Address} token1={token1Address} step={true} />
  } else
    return (
      <AutoColumn gap="20px">
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
              <Row align="flex-end">
                <TokenLogo address={token0Address} />
                <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                  {token0?.symbol}{' '}
                </Text>
                <TYPE.darkGray fontWeight={500} fontSize={16} marginLeft={'8px'}>
                  {token0?.symbol === 'ETH' && '(default)'}
                </TYPE.darkGray>
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
              disabled={step !== 1}
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
          {pairExists ? (
            <AutoRow padding="10px" justify="center">
              <TYPE.body textAlign="center">
                Pool already exists!
                <Link onClick={() => history.push('/add/' + token0Address + '-' + token1Address)}> Join the pool.</Link>
              </TYPE.body>
            </AutoRow>
          ) : (
            <ButtonPrimary disabled={step !== 2}>
              <Text fontWeight={500} fontSize={20}>
                Create Pool
              </Text>
            </ButtonPrimary>
          )}
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
          showCommonBases={true}
        />
      </AutoColumn>
    )
}

export default withRouter(CreatePool)
