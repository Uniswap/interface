import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { ButtonEmphasis, ButtonSize, ThemeButton } from 'components/Button'
import Row from 'components/Row'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { currencyId } from 'utils/currencyId'

const PoolDetailsStatsButtonsRow = styled(Row)`
  gap: 12px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    display: none;
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

function findMatchingPosition(positions: PositionInfo[], token0?: Token, token1?: Token, feeTier?: number) {
  return positions?.find(
    (position) =>
      (position?.details.token0.toLowerCase() === token0?.id ||
        position?.details.token0.toLowerCase() === token1?.id) &&
      (position?.details.token1.toLowerCase() === token0?.id ||
        position?.details.token1.toLowerCase() === token1?.id) &&
      position?.details.fee == feeTier &&
      !position.closed
  )
}

export function PoolDetailsStatsButtons({ chainId, token0, token1, feeTier }: PoolDetailsStatsButtonsProps) {
  const { chainId: walletChainId, connector, account } = useWeb3React()
  const { positions: userOwnedPositions } = useMultiChainPositions(account ?? '', chainId ? [chainId] : undefined)
  const position = userOwnedPositions && findMatchingPosition(userOwnedPositions, token0, token1, feeTier)
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
          ? `/swap?inputCurrency=${currencyId(currency0)}&outputCurrency=${currencyId(currency1)}`
          : `/increase/${currencyId(currency0)}/${currencyId(currency1)}/${feeTier}${tokenId ? `/${tokenId}` : ''}`
      )
    }
  }
  if (!currency0 || !currency1) return null
  return (
    <PoolDetailsStatsButtonsRow>
      <PoolButton
        size={ButtonSize.medium}
        emphasis={ButtonEmphasis.highSoft}
        onClick={() => handleOnClick(false)}
        data-testid="pool-details-add-liquidity-button"
      >
        <Trans>Add liquidity</Trans>
      </PoolButton>

      <PoolButton
        size={ButtonSize.medium}
        emphasis={ButtonEmphasis.highSoft}
        onClick={() => handleOnClick(true)}
        data-testid="pool-details-swap-button"
      >
        <Trans>Swap</Trans>
      </PoolButton>
    </PoolDetailsStatsButtonsRow>
  )
}
