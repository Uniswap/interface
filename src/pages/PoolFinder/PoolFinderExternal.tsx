import { Currency, JSBI } from '@uniswap/sdk'
import { ETHER, TokenAmount } from 'libs/sdk/src'
import React, { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { Text } from 'rebass'
import { t, Trans } from '@lingui/macro'
import { ButtonDropdownLight } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import { FindPoolTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard/PositionCardUNI'
import { MinimalPositionCard as MinimalPositionCardSUSHI } from '../../components/PositionCard/PositionCardSUSHI'
import Row from '../../components/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { PairState, usePair } from '../../data/ReservesUNI'
import { usePair as usePairSUSHI } from '../../data/ReservesSUSHI'
import { useActiveWeb3React } from '../../hooks'
import { usePairAdder } from '../../state/user/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { StyledInternalLink } from '../../theme'
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'
import { BlueCard } from '../../components/Card'
import { TYPE } from '../../theme'
import { tokenSushiToDmm } from 'utils/dmm'
import useTheme from 'hooks/useTheme'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1
}

function usePoolUNI(currency0: Currency | null, currency1: Currency | null) {
  const { account } = useActiveWeb3React()
  const [pairState, pair] = usePair(currency0 ?? undefined, currency1 ?? undefined)
  const validPairNoLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))
    )

  const position: TokenAmount | undefined = useTokenBalance(account ?? undefined, pair?.liquidityToken)
  const hasPosition = Boolean(position && JSBI.greaterThan(position.raw, JSBI.BigInt(0)))
  return { pairState, pair, validPairNoLiquidity, position, hasPosition }
}

function usePoolSUSHI(currency0: Currency | null, currency1: Currency | null) {
  const { account } = useActiveWeb3React()
  const [pairState, pair] = usePairSUSHI(currency0 ?? undefined, currency1 ?? undefined)
  const validPairNoLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))
    )

  const position: TokenAmount | undefined = useTokenBalance(
    account ?? undefined,
    !pair?.liquidityToken ? undefined : tokenSushiToDmm(pair?.liquidityToken)
  )
  const hasPosition = Boolean(position && JSBI.greaterThan(position.raw, JSBI.BigInt(0)))
  return { pairState, pair, validPairNoLiquidity, position, hasPosition }
}

export default function PoolFinderExternal() {
  const { account } = useActiveWeb3React()
  const theme = useTheme()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(ETHER)
  const [currency1, setCurrency1] = useState<Currency | null>(null)
  const { pairState, pair, validPairNoLiquidity, position, hasPosition } = usePoolUNI(currency0, currency1)
  const {
    pairState: pairStateSushi,
    pair: pairSushi,
    validPairNoLiquidity: validPairNoLiquiditySushi,
    position: positionSushi,
    hasPosition: hasPositionSushi
  } = usePoolSUSHI(currency0, currency1)
  const addPair = usePairAdder()
  useEffect(() => {
    if (pair) {
      addPair(pair)
    } else if (pairSushi) {
      addPair(pairSushi)
    }
  }, [pair, pairSushi, addPair])

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

  function showPostion(
    pairState: any,
    pair: any,
    validPairNoLiquidity: any,
    position: any,
    hasPosition: any,
    type: string,
    Comp: any
  ) {
    return (
      <>
        {currency0 &&
          currency1 &&
          (pairState === PairState.EXISTS ? (
            hasPosition && pair ? (
              <Comp pair={pair} border="1px solid #CED0D9" />
            ) : (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <Text textAlign="center">
                    <Trans>You don’t have liquidity in this {type} pool yet.</Trans>
                  </Text>
                </AutoColumn>
              </LightCard>
            )
          ) : validPairNoLiquidity ? (
            <LightCard padding="45px 10px">
              <AutoColumn gap="sm" justify="center">
                <Text textAlign="center">
                  <Trans>No {type} pool found.</Trans>
                </Text>
              </AutoColumn>
            </LightCard>
          ) : pairState === PairState.INVALID ? (
            <LightCard padding="45px 10px">
              <AutoColumn gap="sm" justify="center">
                <Text textAlign="center" fontWeight={500}>
                  <Trans>Invalid pair.</Trans>
                </Text>
              </AutoColumn>
            </LightCard>
          ) : pairState === PairState.LOADING ? (
            <LightCard padding="45px 10px">
              <AutoColumn gap="sm" justify="center">
                <Text textAlign="center">
                  <Trans>Loading</Trans>
                  <Dots />
                </Text>
              </AutoColumn>
            </LightCard>
          ) : null)}
      </>
    )
  }
  return (
    <AppBody>
      <FindPoolTabs />
      <AutoColumn style={{ padding: '1rem' }} gap="md">
        <BlueCard>
          <AutoColumn gap="10px">
            <TYPE.link fontWeight={400} color={theme.text}>
              <Trans>
                <b>Tip:</b> Use this tool to find pairs that don&apos;t automatically appear in the interface.
              </Trans>
            </TYPE.link>
          </AutoColumn>
        </BlueCard>
        <ButtonDropdownLight
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN0)
          }}
        >
          {currency0 ? (
            <Row>
              <CurrencyLogo currency={currency0} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {currency0.symbol}
              </Text>
            </Row>
          ) : (
            <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
              <Trans>Select a Token</Trans>
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
          {currency1 ? (
            <Row>
              <CurrencyLogo currency={currency1} />
              <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
                {currency1.symbol}
              </Text>
            </Row>
          ) : (
            <Text fontWeight={500} fontSize={20} marginLeft={'12px'}>
              <Trans>Select a Token</Trans>
            </Text>
          )}
        </ButtonDropdownLight>
        {(hasPosition || hasPositionSushi) && (
          <ColumnCenter
            style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
          >
            <Text textAlign="center" fontWeight={500}>
              <Trans>Pool Found!</Trans>
            </Text>
            <StyledInternalLink to={`/migration`}>
              <Text textAlign="center">
                <Trans>Manage this pool.</Trans>
              </Text>
            </StyledInternalLink>
          </ColumnCenter>
        )}
        {currency0 && currency1 ? (
          <>
            {showPostion(pairState, pair, validPairNoLiquidity, position, hasPosition, 'UNI', MinimalPositionCard)}
            {showPostion(
              pairStateSushi,
              pairSushi,
              validPairNoLiquiditySushi,
              positionSushi,
              hasPositionSushi,
              'SUSHI',
              MinimalPositionCardSUSHI
            )}
          </>
        ) : (
          prerequisiteMessage
        )}
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
