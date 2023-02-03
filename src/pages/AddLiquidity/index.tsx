import { Fraction, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import LiquidityProviderMode from 'components/LiquidityProviderMode'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import { TutorialType } from 'components/Tutorial'
import { PairState } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useDerivedMintInfo } from 'state/mint/hooks'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import TokenPair from './TokenPair'
import ZapIn from './ZapIn'
import { Container, LiquidityProviderModeWrapper, PageWrapper, PoolName, TopBar } from './styled'

export default function AddLiquidity() {
  const { currencyIdA = '', currencyIdB = '', pairAddress = '' } = useParams()
  const { chainId, isEVM } = useActiveWeb3React()
  const currencyA = useCurrency(currencyIdA) ?? undefined
  const currencyB = useCurrency(currencyIdB) ?? undefined

  const nativeA = useCurrencyConvertedToNative(currencyA)
  const nativeB = useCurrencyConvertedToNative(currencyB)

  const currencyAIsWETH = !!(chainId && currencyA?.equals(WETH[chainId]))
  const currencyBIsWETH = !!(chainId && currencyB?.equals(WETH[chainId]))

  const oneCurrencyIsWETH = currencyBIsWETH || currencyAIsWETH

  const { pair, pairState, noLiquidity } = useDerivedMintInfo(currencyA, currencyB, pairAddress)
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

  if (!isEVM) return <Navigate to="/" />
  return (
    <>
      <PageWrapper>
        <Container>
          <AddRemoveTabs action={LiquidityAction.ADD} tutorialType={TutorialType.CLASSIC_ADD_LIQUIDITY} />

          <TopBar>
            <LiquidityProviderModeWrapper>
              <LiquidityProviderMode
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                singleTokenInfo={t`Add liquidity to the pool by supplying a single token (either token from the token pair). We will automatically create LP tokens for you and add them to the liquidity pool - all in a single transaction`}
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
