import { Pair } from '@kyberswap/ks-sdk-classic'
import { Currency, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { Navigate } from 'react-router-dom'
import { Text } from 'rebass'

import { ButtonDropdownLight } from 'components/Button'
import { LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { FindPoolTabs } from 'components/NavigationTabs'
import { NarrowPositionCard } from 'components/PositionCard'
import Row from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { NativeCurrencies } from 'constants/tokens'
import { PairState, usePair } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import AppBody from 'pages/AppBody'
import { Dots } from 'pages/Pool/styleds'
import { usePairAdderByTokens } from 'state/user/hooks'
import { useTokenBalances } from 'state/wallet/hooks'
import { StyledInternalLink } from 'theme'
import { currencyId } from 'utils/currencyId'
import { useCurrencyConvertedToNative } from 'utils/dmm'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
}

export default function PoolFinder() {
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(NativeCurrencies[chainId])
  const [currency1, setCurrency1] = useState<Currency | null>(null)

  // pairs: {PairState, Pair, isStaticFeePair}[]
  const pairs: [PairState, Pair | null][] = usePair(currency0 ?? undefined, currency1 ?? undefined)

  const addPair = usePairAdderByTokens()
  useEffect(() => {
    if (pairs.length > 0) {
      const token0 = currency0?.wrapped
      const token1 = currency1?.wrapped
      if (!!(token0 && token1)) {
        addPair(token0, token1)
      }
    }
  }, [pairs, addPair, currency0, currency1, chainId])

  const positions: { [tokenAddress: string]: TokenAmount | undefined } = useTokenBalances(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pairs.every(([, pair]) => pair) ? pairs.map(([, pair]) => pair!.liquidityToken) : undefined,
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField],
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
            JSBI.greaterThan((positions[pair.liquidityToken.address] as TokenAmount).quotient, JSBI.BigInt(0)),
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

  const { mixpanelHandler } = useMixpanel()
  useEffect(() => {
    mixpanelHandler(MIXPANEL_TYPE.IMPORT_POOL_INITIATED)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isEVM) return <Navigate to="/" />
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
          to={`/pools/${networkInfo.route}/${!!currency0 ? currencyId(currency0, chainId) : undefined}/${
            !!currency1 ? currencyId(currency1, chainId) : undefined
          }?tab=classic`}
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
                  <StyledInternalLink to={`/myPools?tab=classic`}>
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
