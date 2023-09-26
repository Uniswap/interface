import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { getValidUrlChainName, supportedChainIdFromGQLChain } from 'graphql/data/util'
import { usePoolData } from 'graphql/thegraph/PoolData'
import { useCurrency } from 'hooks/Tokens'
import { useSwitchChain } from 'hooks/useSwitchChain'
import NotFound from 'pages/NotFound'
import { useReducer } from 'react'
import { useParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { isAddress } from 'utils'
import { currencyId } from 'utils/currencyId'

import { PoolDetailsHeader } from './PoolDetailsHeader'
import { PoolDetailsStats } from './PoolDetailsStats'

const PageWrapper = styled(Row)`
  padding: 48px;
  width: 100%;
  align-items: flex-start;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: column;
  }

  @media (max-width: ${BREAKPOINTS.sm - 1}px) {
    padding: 48px 16px;
  }
`

const RightColumn = styled(Column)`
  gap: 24px;
  margin: 0 48px 0 auto;
  width: 22vw;
  min-width: 360px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    margin: 44px 0px;
    width: 100%;
    min-width: unset;
  }
`

const PoolButton = styled(ThemeButton)`
  padding: 12px 16px 12px 12px;
  border-radius: 900px;
  width: 50%;
`

export default function PoolDetailsPage() {
  const { poolAddress, chainName } = useParams<{
    poolAddress: string
    chainName: string
  }>()
  const chain = getValidUrlChainName(chainName)
  const chainId = chain && supportedChainIdFromGQLChain(chain)
  const { data: poolData, loading } = usePoolData(poolAddress ?? '', chainId)
  const [isReversed, toggleReversed] = useReducer((x) => !x, false)
  const token0 = isReversed ? poolData?.token1 : poolData?.token0
  const token1 = isReversed ? poolData?.token0 : poolData?.token1
  const isInvalidPool = !chainName || !poolAddress || !getValidUrlChainName(chainName) || !isAddress(poolAddress)
  const poolNotFound = (!loading && !poolData) || isInvalidPool

  const { chainId: walletChainId, connector, account } = useWeb3React()

  const { positions } = useMultiChainPositions(account ?? '', chainId ? [chainId] : undefined)
  const position = positions?.find(
    (position) =>
      (position?.details.token0.toLowerCase() === token0?.id ||
        position?.details.token0.toLowerCase() === token1?.id) &&
      (position?.details.token1.toLowerCase() === token0?.id || position?.details.token1.toLowerCase() === token1?.id)
  )
  const tokenId = position?.details.tokenId
  const switchChain = useSwitchChain()
  const navigate = useNavigate()
  const currency0 = useCurrency(token0?.id, chainId)
  const currency1 = useCurrency(token1?.id, chainId)
  const handleOnClick = async (toSwap: boolean) => {
    if (currency0 && currency1) {
      if (walletChainId !== chainId && chainId) await switchChain(connector, chainId)
      navigate(
        toSwap
          ? `/swap?inputCurrency=${currency0.isNative ? currency0.symbol : currencyId(currency0)}&outputCurrency=${
              currency1.isNative ? currency1.symbol : currencyId(currency1)
            }`
          : `/increase/${currencyId(currency0)}/${currencyId(currency1)}/${poolData?.feeTier}${
              tokenId ? `/${tokenId}` : ''
            }`
      )
    }
  }

  // TODO(WEB-2814): Add skeleton once designed
  if (loading) return null
  if (poolNotFound) return <NotFound />
  return (
    <PageWrapper>
      <PoolDetailsHeader
        chainId={chainId}
        poolAddress={poolAddress}
        token0={token0}
        token1={token1}
        feeTier={poolData?.feeTier}
        toggleReversed={toggleReversed}
      />
      <RightColumn>
        {currency0 && currency1 && (
          <Row gap="12px">
            <PoolButton
              size={ButtonSize.medium}
              emphasis={ButtonEmphasis.highSoft}
              // TODO take into account tokenId if account logged in
              onClick={() => handleOnClick(false)}
            >
              <Trans>Add liquidity</Trans>
            </PoolButton>

            <PoolButton size={ButtonSize.medium} emphasis={ButtonEmphasis.highSoft} onClick={() => handleOnClick(true)}>
              <Trans>Swap</Trans>
            </PoolButton>
          </Row>
        )}
        {poolData && <PoolDetailsStats poolData={poolData} isReversed={isReversed} chainId={chainId} />}
      </RightColumn>
    </PageWrapper>
  )
}
