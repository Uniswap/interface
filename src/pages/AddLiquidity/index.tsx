import React, { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'
import { t, Trans } from '@lingui/macro'

import { currencyEquals, WETH } from '@dynamic-amm/sdk'
import { AddRemoveTabs } from 'components/NavigationTabs'
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

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, pairAddress }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; pairAddress: string }>) {
  const { chainId } = useActiveWeb3React()
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const nativeA = useCurrencyConvertedToNative(currencyA || undefined)
  const nativeB = useCurrencyConvertedToNative(currencyB || undefined)

  const currencyAIsWETH = !!(chainId && currencyA && currencyEquals(currencyA, WETH[chainId]))
  const currencyBIsWETH = !!(chainId && currencyB && currencyEquals(currencyB, WETH[chainId]))

  const oneCurrencyIsWETH = currencyBIsWETH || currencyAIsWETH

  const { pair, pairState, noLiquidity } = useDerivedMintInfo(
    currencyA ?? undefined,
    currencyB ?? undefined,
    pairAddress
  )

  const [activeTab, setActiveTab] = useState(0)

  return (
    <>
      <PageWrapper>
        <Container>
          <AddRemoveTabs creating={false} adding={true} />

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
