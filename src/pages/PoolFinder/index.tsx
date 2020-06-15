import { JSBI, Pair, Token, TokenAmount, WETH } from '@uniswap/sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { Text } from 'rebass'
import { ButtonDropdownLight } from '../../components/Button'
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

export default function PoolFinder() {
  const { account, chainId } = useActiveWeb3React()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [token0Address, setToken0Address] = useState<string>(WETH[chainId].address)
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

  const newPair: boolean =
    pair === null ||
    (!!pair && JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) && JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0)))

  const position: TokenAmount = useTokenBalanceTreatingWETHasETH(account, pair?.liquidityToken)
  const poolImported: boolean = !!position && JSBI.greaterThan(position.raw, JSBI.BigInt(0))

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
        <ButtonDropdownLight
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN0)
          }}
        >
          {token0 ? (
            <Row>
              <TokenLogo address={token0Address} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {token0.symbol}
              </Text>
            </Row>
          ) : (
            <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
              Select a Token
            </Text>
          )}
        </ButtonDropdownLight>

        <ColumnCenter>
          <Plus size="16" color="#888D9B" />
        </ColumnCenter>

        <ButtonDropdownLight
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN1)
          }}
        >
          {token1 ? (
            <Row>
              <TokenLogo address={token1Address} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {token1.symbol}
              </Text>
            </Row>
          ) : (
            <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
              Select a Token
            </Text>
          )}
        </ButtonDropdownLight>

        {poolImported && (
          <ColumnCenter
            style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
          >
            <Text textAlign="center" fontWeight={500} color="">
              Pool Found!
            </Text>
          </ColumnCenter>
        )}

        {position ? (
          poolImported ? (
            <PositionCard pair={pair} minimal={true} border="1px solid #CED0D9" />
          ) : (
            <LightCard padding="45px 10px">
              <AutoColumn gap="sm" justify="center">
                <Text textAlign="center">You don’t have liquidity in this pool yet.</Text>
                <StyledInternalLink to={`/add/${token0.address}-${token1.address}`}>
                  <Text textAlign="center">Add liquidity?</Text>
                </StyledInternalLink>
              </AutoColumn>
            </LightCard>
          )
        ) : newPair ? (
          <LightCard padding="45px 10px">
            <AutoColumn gap="sm" justify="center">
              <Text textAlign="center">No pool found.</Text>
              <StyledInternalLink to={`/add/${token0Address}-${token1Address}`}>Create pool?</StyledInternalLink>
            </AutoColumn>
          </LightCard>
        ) : (
          <LightCard padding="45px 10px">
            <Text textAlign="center">
              {!account ? 'Connect to a wallet to find pools' : 'Select a token to find your liquidity.'}
            </Text>
          </LightCard>
        )}
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
