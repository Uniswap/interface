import { Currency, ETHER, JSBI, Pair, TokenAmount } from '@dynamic-amm/sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { ButtonDropdownLight } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import { FindPoolTabs } from '../../components/NavigationTabs'
import { NarrowPositionCard } from '../../components/PositionCard'
import Row from '../../components/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { PairState, usePair } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { usePairAdderByTokens } from '../../state/user/hooks'
import { useTokenBalances } from '../../state/wallet/hooks'
import { StyledInternalLink } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1
}

export default function PoolFinder() {
  const { account, chainId } = useActiveWeb3React()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(ETHER)
  const [currency1, setCurrency1] = useState<Currency | null>(null)

  const pairs: [PairState, Pair | null][] = usePair(currency0 ?? undefined, currency1 ?? undefined)
  const addPair = usePairAdderByTokens()
  useEffect(() => {
    if (pairs.length > 0) {
      const token0 = wrappedCurrency(currency0 || undefined, chainId)
      const token1 = wrappedCurrency(currency1 || undefined, chainId)
      if (!!(token0 && token1)) {
        addPair(token0, token1)
      }
    }
  }, [pairs, addPair])

  const positions: { [tokenAddress: string]: TokenAmount | undefined } = useTokenBalances(
    account ?? undefined,
    pairs.map(([, pair]) => pair?.liquidityToken)
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField]
  )

  const myPairs = pairs
    .filter(([pairState, pair]) => {
      // const validPairNoLiquidity: boolean =
      //   pairState === PairState.NOT_EXISTS ||
      //   Boolean(
      //     pairState === PairState.EXISTS &&
      //       pair &&
      //       JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) &&
      //       JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))
      //   )
      let hasPosition = false
      if (pair && pair.liquidityToken.address && positions[pair.liquidityToken.address]) {
        hasPosition = Boolean(
          positions[pair.liquidityToken.address] &&
            JSBI.greaterThan((positions[pair.liquidityToken.address] as TokenAmount).raw, JSBI.BigInt(0))
        )
      }
      return pairState === PairState.EXISTS && hasPosition && pair
    })
    .map(([_, pair], index) => !!pair && <NarrowPositionCard key={index} pair={pair} border="1px solid #CED0D9" />)

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  const prerequisiteMessage = (
    <LightCard padding="45px 10px">
      <Text textAlign="center">
        {!account ? t`Connect to a wallet to find pools` : t`Select a token to find your liquidity.`}
      </Text>
    </LightCard>
  )

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)
  return (
    <AppBody>
      <FindPoolTabs />
      <AutoColumn gap="md">
        <ButtonDropdownLight
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN0)
          }}
        >
          {native0 ? (
            <Row>
              <CurrencyLogo currency={currency0 || undefined} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {native0?.symbol}
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
          {native1 ? (
            <Row>
              <CurrencyLogo currency={currency1 || undefined} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {native1?.symbol}
              </Text>
            </Row>
          ) : (
            <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
              Select a Token
            </Text>
          )}
        </ButtonDropdownLight>
        <StyledInternalLink
          to={`/pools/${!!currency0 ? currencyId(currency0, chainId) : undefined}/${
            !!currency1 ? currencyId(currency1, chainId) : undefined
          }`}
        >
          <Text textAlign="center">
            <Trans>Add liquidity</Trans>
          </Text>
        </StyledInternalLink>
        {pairs.filter(([pairState]) => pairState === PairState.LOADING).length > 0 && (
          <LightCard padding="45px 10px">
            <AutoColumn gap="sm" justify="center">
              <Text textAlign="center">
                <Trans>Loading</Trans>
                <Dots />
              </Text>
            </AutoColumn>
          </LightCard>
        )}

        {currency0 && currency1
          ? myPairs.length > 0 && (
              <>
                <ColumnCenter
                  style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
                >
                  <Text textAlign="center" fontWeight={500}>
                    <Trans>Pool Found!</Trans>
                  </Text>
                  <StyledInternalLink to={`/myPools`}>
                    <Text textAlign="center">
                      <Trans>Manage your pools.</Trans>
                    </Text>
                  </StyledInternalLink>
                </ColumnCenter>
                {myPairs}
              </>
            )
          : prerequisiteMessage}
      </AutoColumn>

      <CurrencySearchModal
        isOpen={showSearch}
        onCurrencySelect={handleCurrencySelect}
        onDismiss={handleSearchDismiss}
        showCommonBases
        selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
      />
    </AppBody>
  )
}
