import { Fraction, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import LiquidityProviderMode from 'components/LiquidityProviderMode'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import { MinimalPositionCard } from 'components/PositionCard'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { useDerivedBurnInfo } from 'state/burn/hooks'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import TokenPair from './TokenPair'
import ZapOut from './ZapOut'
import { Container, LiquidityProviderModeWrapper, PageWrapper, PoolName, TopBar } from './styled'

export default function RemoveLiquidity() {
  const { currencyIdA = '', currencyIdB = '', pairAddress = '' } = useParams()
  const currencyA = useCurrency(currencyIdA) ?? undefined
  const currencyB = useCurrency(currencyIdB) ?? undefined
  const { chainId, isEVM } = useActiveWeb3React()

  const nativeA = useCurrencyConvertedToNative(currencyA)
  const nativeB = useCurrencyConvertedToNative(currencyB)

  const { pair } = useDerivedBurnInfo(currencyA, currencyB, pairAddress)

  const amp = pair?.amp || JSBI.BigInt(0)

  const oneCurrencyIsWETH = Boolean(chainId && (currencyA?.equals(WETH[chainId]) || currencyB?.equals(WETH[chainId])))

  const [activeTab, setActiveTab] = useState(0)
  const { mixpanelHandler } = useMixpanel()
  useEffect(() => {
    mixpanelHandler(MIXPANEL_TYPE.REMOVE_LIQUIDITY_INITIATED, {
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
          <AddRemoveTabs action={LiquidityAction.REMOVE} />

          <TopBar>
            <LiquidityProviderModeWrapper>
              <LiquidityProviderMode
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                singleTokenInfo={t`We will automatically remove your liquidity and convert it into your desired token (either token from the token pair), all in a single transaction`}
              />
            </LiquidityProviderModeWrapper>
            <PoolName>
              {nativeA?.symbol} - {nativeB?.symbol} <Trans>pool</Trans>
            </PoolName>
          </TopBar>

          {activeTab === 0 ? (
            <TokenPair currencyIdA={currencyIdA} currencyIdB={currencyIdB} pairAddress={pairAddress} />
          ) : (
            <ZapOut currencyIdA={currencyIdA} currencyIdB={currencyIdB} pairAddress={pairAddress} />
          )}
        </Container>

        {pair ? (
          <Container style={{ marginTop: '24px', padding: '0' }}>
            <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
          </Container>
        ) : null}
      </PageWrapper>
    </>
  )
}
