import React, { useState, useEffect } from 'react'
import { RouteComponentProps, Redirect } from 'react-router-dom'
import { Token, WETH } from '@uniswap/sdk'
import AppBody from '../AppBody'

import Row, { AutoRow } from '../../components/Row'
import TokenLogo from '../../components/TokenLogo'
import SearchModal from '../../components/SearchModal'
import { Text } from 'rebass'
import { Plus } from 'react-feather'
import { TYPE, StyledInternalLink } from '../../theme'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import { ButtonPrimary, ButtonDropwdown, ButtonDropwdownLight } from '../../components/Button'

import { useToken } from '../../hooks/Tokens'
import { useActiveWeb3React } from '../../hooks'
import { usePair } from '../../data/Reserves'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1
}

enum STEP {
  SELECT_TOKENS = 'SELECT_TOKENS', // choose input and output tokens
  READY_TO_CREATE = 'READY_TO_CREATE', // enable 'create' button
  SHOW_CREATE_PAGE = 'SHOW_CREATE_PAGE' // show create page
}

export default function CreatePool({ location }: RouteComponentProps) {
  const { chainId } = useActiveWeb3React()
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN0)

  const [token0Address, setToken0Address] = useState<string>(WETH[chainId].address)
  const [token1Address, setToken1Address] = useState<string>()

  const token0: Token = useToken(token0Address)
  const token1: Token = useToken(token1Address)

  const [step, setStep] = useState<string>(STEP.SELECT_TOKENS)

  const pair = usePair(token0, token1)

  // if both tokens selected but pair doesnt exist, enable button to create pair
  useEffect(() => {
    if (token0Address && token1Address && pair === null) {
      setStep(STEP.READY_TO_CREATE)
    }
  }, [pair, token0Address, token1Address])

  // if theyve clicked create, show add liquidity page
  if (step === STEP.SHOW_CREATE_PAGE) {
    return <Redirect to={{ ...location, pathname: `/add/${token0Address}-${token1Address}` }} push={true} />
  }

  return (
    <AppBody>
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
                  {token0?.address === WETH[chainId]?.address && '(default)'}
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
              disabled={step !== STEP.SELECT_TOKENS}
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
          {pair ? ( // pair already exists - prompt to add liquidity to existing pool
            <AutoRow padding="10px" justify="center">
              <TYPE.body textAlign="center">
                Pool already exists!{' '}
                <StyledInternalLink to={`/add/${token0Address}-${token1Address}`}>Join the pool.</StyledInternalLink>
              </TYPE.body>
            </AutoRow>
          ) : (
            <ButtonPrimary disabled={step !== STEP.READY_TO_CREATE} onClick={() => setStep(STEP.SHOW_CREATE_PAGE)}>
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
          showCommonBases={activeField === Fields.TOKEN0}
        />
      </AutoColumn>
    </AppBody>
  )
}
