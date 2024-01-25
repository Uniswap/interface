import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import Column from 'components/Column'
import { ReverseArrow } from 'components/Icons/ReverseArrow'
import Row from 'components/Row'
import { SwapWrapperOuter } from 'components/swap/styled'
import { LoadingBubble } from 'components/Tokens/loading'
import { Token } from 'graphql/thegraph/__generated__/types-and-hooks'
import { useCurrency } from 'hooks/Tokens'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { Swap } from 'pages/Swap'
import { useReducer } from 'react'
import { ExternalLink, Plus, X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { currencyId } from 'utils/currencyId'

const PoolDetailsStatsButtonsRow = styled(Row)`
  gap: 12px;
  z-index: 1;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    display: none;
  }
`

const PoolButton = styled.button<{ open?: boolean }>`
  display: flex;
  flex-direction: row;
  padding: 12px 16px 12px 12px;
  border: unset;
  border-radius: 900px;
  width: ${({ open }) => (open ? '100px' : '50%')};
  gap: 8px;
  color: ${({ theme, open }) => (open ? theme.neutral1 : theme.accent1)};
  background-color: ${({ theme, open }) => !open && opacify(12, theme.accent1)};
  justify-content: center;
  transition: ${({ theme }) => `width ${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  border: ${({ theme, open }) => open && `1px solid ${theme.surface3}`};
  ${ClickableStyle}
`

const SwapIcon = styled(ReverseArrow)`
  fill: ${({ theme }) => theme.accent1};
  rotate: 90deg;
`

const ButtonBubble = styled(LoadingBubble)`
  height: 44px;
  width: 175px;
  border-radius: 900px;
`

const SwapModalWrapper = styled.div<{ open?: boolean }>`
  z-index: 0;
  max-height: ${({ open }) => (open ? '100vh' : '0')};
  transition: ${({ theme }) => `max-height ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};
  padding-bottom: ${({ open }) => (open ? '24px' : '0')};

  ${SwapWrapperOuter} {
    &:before {
      background-color: unset;
    }
  }

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    display: none;
  }
`

interface PoolDetailsStatsButtonsProps {
  chainId?: number
  token0?: Token
  token1?: Token
  feeTier?: number
  loading?: boolean
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

export function PoolDetailsStatsButtons({ chainId, token0, token1, feeTier, loading }: PoolDetailsStatsButtonsProps) {
  const { chainId: walletChainId, connector, account } = useWeb3React()
  const { positions: userOwnedPositions } = useMultiChainPositions(account ?? '', chainId ? [chainId] : undefined)
  const position = userOwnedPositions && findMatchingPosition(userOwnedPositions, token0, token1, feeTier)
  const tokenId = position?.details.tokenId
  const switchChain = useSwitchChain()
  const navigate = useNavigate()
  const currency0 = useCurrency(token0?.id, chainId)
  const currency1 = useCurrency(token1?.id, chainId)
  const handleAddLiquidity = async () => {
    if (currency0 && currency1) {
      if (walletChainId !== chainId && chainId) await switchChain(connector, chainId)
      navigate(`/add/${currencyId(currency0)}/${currencyId(currency1)}/${feeTier}${tokenId ? `/${tokenId}` : ''}`)
    }
  }
  const [swapModalOpen, toggleSwapModalOpen] = useReducer((state) => !state, false)
  const [addLiquidityHovered, toggleAddLiquidityHovered] = useReducer((state) => !state, false)

  if (loading || !currency0 || !currency1)
    return (
      <PoolDetailsStatsButtonsRow data-testid="pdp-buttons-loading-skeleton">
        <ButtonBubble />
        <ButtonBubble />
      </PoolDetailsStatsButtonsRow>
    )

  return (
    <Column gap="lg">
      <PoolDetailsStatsButtonsRow>
        <PoolButton
          onClick={toggleSwapModalOpen}
          open={swapModalOpen}
          data-testid={`pool-details-${swapModalOpen ? 'close' : 'swap'}-button`}
        >
          {swapModalOpen ? (
            <>
              <X size={20} />
              <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
                <Trans>Close</Trans>
              </ThemedText.BodyPrimary>
            </>
          ) : (
            <>
              <SwapIcon />
              <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
                <Trans>Swap</Trans>
              </ThemedText.BodyPrimary>
            </>
          )}
        </PoolButton>
        <PoolButton
          onClick={handleAddLiquidity}
          onMouseEnter={toggleAddLiquidityHovered}
          onMouseLeave={toggleAddLiquidityHovered}
          data-testid="pool-details-add-liquidity-button"
        >
          {!addLiquidityHovered && <Plus size={20} />}
          <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
            <Trans>Add liquidity</Trans>
          </ThemedText.BodyPrimary>
          {addLiquidityHovered && <ExternalLink size={20} />}
        </PoolButton>
      </PoolDetailsStatsButtonsRow>
      <SwapModalWrapper open={swapModalOpen} data-testid="pool-details-swap-modal">
        <Swap
          chainId={chainId}
          initialInputCurrency={currency0}
          initialOutputCurrency={currency1}
          disableTokenInputs={chainId !== walletChainId}
        />
      </SwapModalWrapper>
    </Column>
  )
}
