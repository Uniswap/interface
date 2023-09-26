import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Column from 'components/Column'
import Row from 'components/Row'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { currencyId } from 'utils/currencyId'

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

interface PoolDetailsStatsButtonsProps {
  chainId?: number
  token0?: Token
  token1?: Token
  feeTier?: number
}

export function PoolDetailsStatsButtons({ chainId, token0, token1, feeTier }: PoolDetailsStatsButtonsProps) {
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
          : `/increase/${currencyId(currency0)}/${currencyId(currency1)}/${feeTier}${tokenId ? `/${tokenId}` : ''}`
      )
    }
  }
  if (!currency0 || !currency1) return null
  return (
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
  )
}
