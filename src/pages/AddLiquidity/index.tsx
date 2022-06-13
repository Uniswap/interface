import React, { useState, useEffect } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'

import { Fraction, WETH } from '@kyberswap/ks-sdk-core'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import LiquidityProviderMode from 'components/LiquidityProviderMode'
import { PairState } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { useDerivedMintInfo } from 'state/mint/hooks'
import { useCurrencyConvertedToNative } from 'utils/dmm'
import ZapIn from './ZapIn'
import TokenPair from './TokenPair'
import { PageWrapper, Container, TopBar, LiquidityProviderModeWrapper, PoolName } from './styled'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import JSBI from 'jsbi'

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, pairAddress },
  },
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; pairAddress: string }>) {
  const { chainId } = useActiveWeb3React()
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const nativeA = useCurrencyConvertedToNative(currencyA || undefined)
  const nativeB = useCurrencyConvertedToNative(currencyB || undefined)

  const currencyAIsWETH = !!(chainId && currencyA && currencyA.equals(WETH[chainId]))
  const currencyBIsWETH = !!(chainId && currencyB && currencyB.equals(WETH[chainId]))

  const oneCurrencyIsWETH = currencyBIsWETH || currencyAIsWETH

  const { pair, pairState, noLiquidity } = useDerivedMintInfo(
    currencyA ?? undefined,
    currencyB ?? undefined,
    pairAddress,
  )
  const amp = pair?.amp || JSBI.BigInt(0)
  const [activeTab, setActiveTab] = useState(0)

  const { mixpanelHandler } = useMixpanel()
  useEffect(() => {
    mixpanelHandler(MIXPANEL_TYPE.ADD_LIQUIDITY_INITIATED, {
      token_1: nativeA?.symbol,
      token_2: nativeB?.symbol,
      amp: new Fraction(amp).divide(JSBI.BigInt(10000)).toSignificant(5),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <>
      <PageWrapper>
        <Container>
          <AddRemoveTabs action={LiquidityAction.ADD} />

          <TopBar>
            <LiquidityProviderModeWrapper>
              <LiquidityProviderMode
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                singleTokenInfo={t`You can add liquidity to the pool by supplying a single token (either token from the token pair). We will automatically create LP tokens for you and add them to the liquidity pool - all in a single transaction`}
              />
            </LiquidityProviderModeWrapper>
            <PoolName>
              {nativeA?.symbol} - {nativeB?.symbol} <Trans>pool</Trans>
            </PoolName>
          </TopBar>

          {activeTab === 0 ? (
            <TokenPair currencyIdA={currencyIdA} currencyIdB={currencyIdB} pairAddress={pairAddress} />
          ) : (
            <ZapIn currencyIdA={currencyIdA} currencyIdB={currencyIdB} pairAddress={pairAddress} />
          )}
        </Container>

        {pair && !noLiquidity && pairState !== PairState.INVALID ? (
          <Container style={{ marginTop: '24px', padding: '0' }}>
            <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
          </Container>
        ) : null}
      </PageWrapper>
    </>
  )
}
