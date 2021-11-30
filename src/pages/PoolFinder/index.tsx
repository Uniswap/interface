import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import JSBI from 'jsbi'
import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'
import { useLocation } from 'react-router'
import { Text as RebassText } from 'rebass'

import { ButtonDropdownLight } from '../../components/Button'
import { LightCard } from '../../components/Card'
import { BlueCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import CurrencyLogo from '../../components/CurrencyLogo'
import { FindPoolTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row from '../../components/Row'
import CurrencySearchModal from '../../components/SearchModal/CurrencySearchModal'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { ExtendedEther } from '../../constants/tokens'
import { PairState, useV2Pair } from '../../hooks/useV2Pairs'
import { useActiveWeb3React } from '../../hooks/web3'
import { usePairAdder } from '../../state/user/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { StyledInternalLink } from '../../theme'
import { TextPreset } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
}

function useQuery() {
  return new URLSearchParams(useLocation().search)
}

export default function PoolFinder() {
  const query = useQuery()

  const { account, chainId } = useActiveWeb3React()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(() => (chainId ? ExtendedEther.onChain(chainId) : null))
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
        JSBI.equal(pair.reserve1.quotient, JSBI.BigInt(0))
    )

  const position: CurrencyAmount<Token> | undefined = useTokenBalance(account ?? undefined, pair?.liquidityToken)
  const hasPosition = Boolean(position && JSBI.greaterThan(position.quotient, JSBI.BigInt(0)))

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
      <RebassText textAlign="center">
        {!account ? (
          <Trans>Connect to a wallet to find pools</Trans>
        ) : (
          <Trans>Select a token to find your v2 liquidity.</Trans>
        )}
      </RebassText>
    </LightCard>
  )

  return (
    <>
      <AppBody>
        <FindPoolTabs origin={query.get('origin') ?? '/pool/v2'} />
        <AutoColumn style={{ padding: '1rem' }} gap="md">
          <BlueCard>
            <AutoColumn gap="10px">
              <TextPreset.Link fontWeight={400} color={'primaryText1'}>
                <Trans>
                  <b>Tip:</b> Use this tool to find v2 pools that don&apos;t automatically appear in the interface.
                </Trans>
              </TextPreset.Link>
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
                <RebassText fontWeight={500} fontSize={20} marginLeft={'12px'}>
                  {currency0.symbol}
                </RebassText>
              </Row>
            ) : (
              <RebassText fontWeight={500} fontSize={20} marginLeft={'12px'}>
                <Trans>Select a token</Trans>
              </RebassText>
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
                <RebassText fontWeight={500} fontSize={20} marginLeft={'12px'}>
                  {currency1.symbol}
                </RebassText>
              </Row>
            ) : (
              <RebassText fontWeight={500} fontSize={20} marginLeft={'12px'}>
                <Trans>Select a token</Trans>
              </RebassText>
            )}
          </ButtonDropdownLight>

          {hasPosition && (
            <ColumnCenter
              style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
            >
              <RebassText textAlign="center" fontWeight={500}>
                <Trans>Pool Found!</Trans>
              </RebassText>
              <StyledInternalLink to={`/pool/v2`}>
                <RebassText textAlign="center">
                  <Trans>Manage this pool.</Trans>
                </RebassText>
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
                    <RebassText textAlign="center">
                      <Trans>You don’t have liquidity in this pool yet.</Trans>
                    </RebassText>
                    <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                      <RebassText textAlign="center">
                        <Trans>Add liquidity.</Trans>
                      </RebassText>
                    </StyledInternalLink>
                  </AutoColumn>
                </LightCard>
              )
            ) : validPairNoLiquidity ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <RebassText textAlign="center">
                    <Trans>No pool found.</Trans>
                  </RebassText>
                  <StyledInternalLink to={`/add/${currencyId(currency0)}/${currencyId(currency1)}`}>
                    <Trans>Create pool.</Trans>
                  </StyledInternalLink>
                </AutoColumn>
              </LightCard>
            ) : pairState === PairState.INVALID ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <RebassText textAlign="center" fontWeight={500}>
                    <Trans>Invalid pair.</Trans>
                  </RebassText>
                </AutoColumn>
              </LightCard>
            ) : pairState === PairState.LOADING ? (
              <LightCard padding="45px 10px">
                <AutoColumn gap="sm" justify="center">
                  <RebassText textAlign="center">
                    <Trans>Loading</Trans>
                    <Dots />
                  </RebassText>
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
          showCommonBases
          selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
        />
      </AppBody>
      <SwitchLocaleLink />
    </>
  )
}
