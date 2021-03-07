import { Currency, JSBI, TokenAmount } from 'dxswap-sdk'
import React, { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { ButtonDropdownLight, ButtonPrimary } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import { FindPoolTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween } from '../../components/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { PairState, usePair } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { useNativeCurrency } from '../../hooks/useNativeCurrency'
import { usePairAdder } from '../../state/user/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1
}

export default function PoolFinder() {
  const { account } = useActiveWeb3React()
  const nativeCurrency = useNativeCurrency()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(nativeCurrency)
  const [currency1, setCurrency1] = useState<Currency | null>(null)

  const [pairState, pair] = usePair(currency0 ?? undefined, currency1 ?? undefined)
  const addPair = usePairAdder()
  useEffect(() => {
    if (pair) {
      addPair(pair)
    }
  }, [pair, addPair])

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
    <LightCard padding="20px">
      <TYPE.body color="text4" fontWeight="500" fontSize="15px" lineHeight="19px" textAlign="center">
        {!account ? 'Connect to a wallet to find pools' : 'Select a token to find your liquidity.'}
      </TYPE.body>
    </LightCard>
  )

  return (
    <AppBody>
      <FindPoolTabs />
      <AutoColumn gap="md">
        <ButtonDropdownLight
          height="52px"
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN0)
          }}
        >
          {currency0 ? (
            <Row>
              <CurrencyLogo size="20px" currency={currency0} />
              <Text fontWeight="600" fontSize="16px" lineHeight="20px" marginLeft={'6px'}>
                {currency0.symbol}
              </Text>
            </Row>
          ) : (
            <Text fontWeight="600" fontSize="16px" lineHeight="20px" marginLeft={'6px'}>
              Select a Token
            </Text>
          )}
        </ButtonDropdownLight>

        <ColumnCenter>
          <Plus size="12" color="#888D9B" />
        </ColumnCenter>

        <ButtonDropdownLight
          height="52px"
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN1)
          }}
        >
          {currency1 ? (
            <Row>
              <CurrencyLogo size="20px" currency={currency1} />
              <Text fontWeight="600" fontSize="16px" lineHeight="20px" marginLeft="6px">
                {currency1.symbol}
              </Text>
            </Row>
          ) : (
            <Text fontWeight="600" fontSize="16px" lineHeight="20px" marginLeft={'6px'}>
              Select a Token
            </Text>
          )}
        </ButtonDropdownLight>

        {currency0 && currency1 ? (
          pairState === PairState.EXISTS ? (
            hasPosition && pair ? (
              <RowBetween marginY="16px">
                <MinimalPositionCard pair={pair} border="1px solid #CED0D9" />
              </RowBetween>
            ) : (
              <>
                <LightCard padding="20px" marginY="16px">
                  <AutoColumn gap="sm" justify="center">
                    <TYPE.body color="text4" fontWeight="500" fontSize="15px" lineHeight="19px" textAlign="center">
                      You don’t have liquidity in this pool yet.
                    </TYPE.body>
                  </AutoColumn>
                </LightCard>
                <Link to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                  <ButtonPrimary>Add liquidity</ButtonPrimary>
                </Link>
              </>
            )
          ) : validPairNoLiquidity ? (
            <>
              <LightCard padding="20px" marginY="16px">
                <AutoColumn gap="sm" justify="center">
                  <TYPE.body color="text4" fontWeight="500" fontSize="15px" lineHeight="19px" textAlign="center">
                    No pool found.
                  </TYPE.body>
                </AutoColumn>
              </LightCard>
              <Link to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                <ButtonPrimary>Create pool</ButtonPrimary>
              </Link>
            </>
          ) : pairState === PairState.INVALID ? (
            <LightCard padding="20px" marginY="16px">
              <AutoColumn gap="sm" justify="center">
                <TYPE.body color="text4" fontWeight="500" fontSize="15px" lineHeight="19px" textAlign="center">
                  Invalid pair.
                </TYPE.body>
              </AutoColumn>
            </LightCard>
          ) : pairState === PairState.LOADING ? (
            <LightCard padding="20px" marginY="16px">
              <AutoColumn gap="sm" justify="center">
                <TYPE.body color="text4" fontWeight="500" fontSize="15px" lineHeight="19px" textAlign="center">
                  Loading
                  <Dots />
                </TYPE.body>
              </AutoColumn>
            </LightCard>
          ) : null
        ) : (
          prerequisiteMessage
        )}

        {hasPosition && (
          <Link to="/pool">
            <ButtonPrimary>Manage this pool</ButtonPrimary>
          </Link>
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
