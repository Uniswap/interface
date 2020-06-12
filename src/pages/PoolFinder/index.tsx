import { JSBI, Pair, Token, TokenAmount } from '@uniswap/sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ButtonDropwdown, ButtonDropwdownLight, ButtonPrimary } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import PositionCard from '../../components/PositionCard'
import Row from '../../components/Row'
import TokenSearchModal from '../../components/SearchModal/TokenSearchModal'
import TokenLogo from '../../components/TokenLogo'
import { usePair } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { useToken } from '../../hooks/Tokens'
import { usePairAdder } from '../../state/user/hooks'
import { useTokenBalanceTreatingWETHasETH } from '../../state/wallet/hooks'
import { StyledInternalLink } from '../../theme'
import AppBody from '../AppBody'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1
}

export default function PoolFinder({ history }: RouteComponentProps) {
  const { account } = useActiveWeb3React()
  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN0)

  const [token0Address, setToken0Address] = useState<string>()
  const [token1Address, setToken1Address] = useState<string>()
  const token0: Token = useToken(token0Address)
  const token1: Token = useToken(token1Address)

  const pair: Pair = usePair(token0, token1)
  const addPair = usePairAdder()

  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

  const position: TokenAmount = useTokenBalanceTreatingWETHasETH(account, pair?.liquidityToken)

  const newPair: boolean =
    pair === null ||
    (!!pair && JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) && JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0)))
  const allowImport: boolean = position && JSBI.greaterThan(position.raw, JSBI.BigInt(0))

  const handleTokenSelect = useCallback(
    (address: string) => {
      activeField === Fields.TOKEN0 ? setToken0Address(address) : setToken1Address(address)
    },
    [activeField]
  )

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  return (
    <AppBody>
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
                <StyledInternalLink to={`/add/${token0Address}-${token1Address}`}>
                  <Text textAlign="center">Add liquidity to this pair instead.</Text>
                </StyledInternalLink>
              </AutoColumn>
            </LightCard>
          )
        ) : newPair ? (
          <LightCard padding="45px">
            <AutoColumn gap="sm" justify="center">
              <Text color="">No pool found.</Text>
              <StyledInternalLink to={`/add/${token0Address}-${token1Address}`}>Create pool?</StyledInternalLink>
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
      <TokenSearchModal
        isOpen={showSearch}
        onTokenSelect={handleTokenSelect}
        onDismiss={handleSearchDismiss}
        hiddenToken={activeField === Fields.TOKEN0 ? token1Address : token0Address}
      />
    </AppBody>
  )
}
