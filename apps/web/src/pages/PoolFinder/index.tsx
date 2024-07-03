import { InterfacePageName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { ButtonDropdownLight } from 'components/Button'
import { BlueCard, LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { FindPoolTabs } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import Row from 'components/Row'
import { CurrencySearchFilters } from 'components/SearchModal/CurrencySearch'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'
import { V2Unsupported } from 'components/V2Unsupported'
import { nativeOnChain } from 'constants/tokens'
import { useAccount } from 'hooks/useAccount'
import { useNetworkSupportsV2 } from 'hooks/useNetworkSupportsV2'
import { PairState, useV2Pair } from 'hooks/useV2Pairs'
import { Trans } from 'i18n'
import JSBI from 'jsbi'
import AppBody from 'pages/App/AppBody'
import { Dots } from 'pages/Pool/styled'
import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { useLocation } from 'react-router-dom'
import { Text } from 'rebass'
import { useTokenBalance } from 'state/connection/hooks'
import { usePairAdder } from 'state/user/hooks'
import { StyledInternalLink, ThemedText } from 'theme/components'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { currencyId } from 'utils/currencyId'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
}

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

const POOLFINDER_CURRENCY_SEARCH_FILTERS: CurrencySearchFilters = {
  showCommonBases: true,
}

export default function PoolFinder() {
  const query = useQuery()

  const account = useAccount()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(() =>
    account.chainId ? nativeOnChain(account.chainId) : null,
  )
  const [currency1, setCurrency1] = useState<Currency | null>(null)

  const [pairState, pair] = useV2Pair(currency0 ?? undefined, currency1 ?? undefined)
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
        JSBI.equal(pair.reserve0.quotient, JSBI.BigInt(0)) &&
        JSBI.equal(pair.reserve1.quotient, JSBI.BigInt(0)),
    )

  const position: CurrencyAmount<Token> | undefined = useTokenBalance(account.address, pair?.liquidityToken)
  const hasPosition = Boolean(position && JSBI.greaterThan(position.quotient, JSBI.BigInt(0)))

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

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  const prerequisiteMessage = (
    <LightCard padding="45px 10px">
      <Text textAlign="center">
        {!account.isConnected ? <Trans i18nKey="poolFinder.connect" /> : <Trans i18nKey="poolFinder.selectToken" />}
      </Text>
    </LightCard>
  )

  const networkSupportsV2 = useNetworkSupportsV2()
  if (!networkSupportsV2) {
    return <V2Unsupported />
  }

  return (
    <Trace logImpression page={InterfacePageName.POOL_PAGE}>
      <>
        <AppBody>
          <FindPoolTabs origin={query.get('origin') ?? '/pools/v2'} />
          <AutoColumn style={{ padding: '1rem' }} gap="md">
            <BlueCard>
              <AutoColumn gap="10px">
                <ThemedText.DeprecatedLink fontWeight={485} color="accent1">
                  <Trans i18nKey="poolFinder.tip" />
                </ThemedText.DeprecatedLink>
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
                  <Text fontWeight={535} fontSize={20} marginLeft="12px">
                    {currency0.symbol}
                  </Text>
                </Row>
              ) : (
                <Text fontWeight={535} fontSize={20} marginLeft="12px">
                  <Trans i18nKey="common.selectToken.label" />
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
                  <Text fontWeight={535} fontSize={20} marginLeft="12px">
                    {currency1.symbol}
                  </Text>
                </Row>
              ) : (
                <Text fontWeight={535} fontSize={20} marginLeft="12px">
                  <Trans i18nKey="common.selectToken.label" />
                </Text>
              )}
            </ButtonDropdownLight>

            {hasPosition && (
              <ColumnCenter
                style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
              >
                <Text textAlign="center" fontWeight={535}>
                  <Trans i18nKey="poolFinder.found" />
                </Text>
                <StyledInternalLink to="/pools/v2">
                  <Text textAlign="center">
                    <Trans i18nKey="poolFinder.managePool" />
                  </Text>
                </StyledInternalLink>
              </ColumnCenter>
            )}

            {currency0 && currency1 ? (
              pairState === PairState.EXISTS ? (
                hasPosition && pair ? (
                  <MinimalPositionCard pair={pair} border="1px solid #CED0D9" />
                ) : (
                  <LightCard padding="45px 10px">
                    <AutoColumn gap="sm" justify="center">
                      <Text textAlign="center">
                        <Trans i18nKey="poolFinder.noLiquidity" />
                      </Text>
                      <StyledInternalLink to={`/add/v2/${currencyId(currency0)}/${currencyId(currency1)}`}>
                        <Text textAlign="center">
                          <Trans i18nKey="common.addLiquidity" />
                        </Text>
                      </StyledInternalLink>
                    </AutoColumn>
                  </LightCard>
                )
              ) : validPairNoLiquidity ? (
                <LightCard padding="45px 10px">
                  <AutoColumn gap="sm" justify="center">
                    <Text textAlign="center">
                      <Trans i18nKey="poolFinder.noPoolFound" />
                    </Text>
                    <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                      <Trans i18nKey="poolFinder.create" />
                    </StyledInternalLink>
                  </AutoColumn>
                </LightCard>
              ) : pairState === PairState.INVALID ? (
                <LightCard padding="45px 10px">
                  <AutoColumn gap="sm" justify="center">
                    <Text textAlign="center" fontWeight={535}>
                      <Trans i18nKey="common.invalidPair" />
                    </Text>
                  </AutoColumn>
                </LightCard>
              ) : pairState === PairState.LOADING ? (
                <LightCard padding="45px 10px">
                  <AutoColumn gap="sm" justify="center">
                    <Text textAlign="center">
                      <Trans i18nKey="common.loading" />
                      <Dots />
                    </Text>
                  </AutoColumn>
                </LightCard>
              ) : null
            ) : (
              prerequisiteMessage
            )}
          </AutoColumn>

          <CurrencySearchModal
            isOpen={showSearch}
            onCurrencySelect={handleCurrencySelect}
            onDismiss={handleSearchDismiss}
            selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
            currencySearchFilters={POOLFINDER_CURRENCY_SEARCH_FILTERS}
          />
        </AppBody>
        <SwitchLocaleLink />
      </>
    </Trace>
  )
}
