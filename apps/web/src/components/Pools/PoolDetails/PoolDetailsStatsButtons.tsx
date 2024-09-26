import { Scrim } from 'components/AccountDrawer'
import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { CurrencySelect } from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { ReverseArrow } from 'components/Icons/ReverseArrow'
import { SwapWrapperOuter } from 'components/swap/styled'
import { LoadingBubble } from 'components/Tokens/loading'
import TokenSafetyMessage from 'components/TokenSafety/TokenSafetyMessage'
import { chainIdToBackendChain, SupportedInterfaceChainId } from 'constants/chains'
import { getPriorityWarning, StrongWarning, useTokenWarning } from 'constants/deprecatedTokenSafety'
import { useTokenBalancesQuery } from 'graphql/data/apollo/TokenBalancesProvider'
import { gqlToCurrency } from 'graphql/data/util'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import styled from 'lib/styled-components'
import { Swap } from 'pages/Swap'
import { useMemo, useReducer } from 'react'
import { Plus, X } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ThemedText } from 'theme/components'
import { opacify } from 'theme/utils'
import { Z_INDEX } from 'theme/zIndex'
import { Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { Trans } from 'uniswap/src/i18n'
import { currencyId } from 'utils/currencyId'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const PoolDetailsStatsButtonsRow = styled(Row)`
  gap: 12px;
  z-index: 1;

  @media (max-width: ${BREAKPOINTS.lg}px) {
    gap: 8px;
    position: fixed;
    bottom: 0px;
    left: 0;
    margin: 8px;
    width: calc(100% - 16px);
    background: ${({ theme }) => theme.surface1};
    padding: 12px 32px;
    border: 1px solid ${({ theme }) => theme.surface3};
    border-radius: 20px;
    backdrop-filter: blur(10px);
    & > :first-child {
      margin-right: auto;
    }
    z-index: ${Z_INDEX.sticky};
  }
  @media (max-width: ${BREAKPOINTS.md}px) {
    bottom: 56px;
  }
`

const PoolButton = styled.button<{ $open?: boolean; $hideOnMobile?: boolean; $fixedWidth?: boolean }>`
  display: flex;
  flex-direction: row;
  padding: 12px 16px 12px 12px;
  border: unset;
  border-radius: 900px;
  width: ${({ $open }) => ($open ? '100px' : '50%')};
  gap: 8px;
  color: ${({ theme, $open }) => ($open ? theme.neutral1 : theme.accent1)};
  background-color: ${({ theme, $open }) => ($open ? theme.surface1 : opacify(12, theme.accent1))};
  justify-content: center;
  transition: ${({ theme }) => `width ${theme.transition.duration.medium} ${theme.transition.timing.inOut}`};
  border: ${({ theme, $open }) => $open && `1px solid ${theme.surface3}`};
  ${ClickableStyle}
  @media (max-width: ${BREAKPOINTS.lg}px) {
    width: ${({ $fixedWidth }) => $fixedWidth && '120px'};
  }
  @media (max-width: ${BREAKPOINTS.sm}px) {
    display: ${({ $hideOnMobile }) => $hideOnMobile && 'none'};
    width: ${({ $fixedWidth }) => !$fixedWidth && '100%'};
  }
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

const SwapModalWrapper = styled(Column)<{ open?: boolean }>`
  z-index: 0;
  gap: 24px;
  visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  opacity: ${({ open }) => (open ? '1' : '0')};
  max-height: ${({ open }) => (open ? '100vh' : '0')};
  transition: ${({ theme }) => `max-height ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};
  padding-bottom: ${({ open }) => (open ? '24px' : '0')};

  ${SwapWrapperOuter} {
    &:before {
      background-color: unset;
    }
  }

  // Need to override the default visibility to properly hide
  ${CurrencySelect} {
    visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  }

  @media (max-width: ${BREAKPOINTS.lg}px) {
    position: fixed;
    width: calc(100% - 16px);
    padding: 0px 12px 12px;
    border-radius: 24px;
    max-width: 480px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    z-index: ${Z_INDEX.fixed};
    background: ${({ theme }) => theme.surface1};
    transition: ${({ theme }) => `opacity ${theme.transition.duration.medium} ${theme.transition.timing.ease}`};
  }
`

const MobileBalance = styled(Column)`
  gap: 2px;
  display: none;
  @media (max-width: ${BREAKPOINTS.lg}px) {
    display: flex;
  }
`

interface PoolDetailsStatsButtonsProps {
  chainId?: SupportedInterfaceChainId
  token0?: Token
  token1?: Token
  feeTier?: number
  loading?: boolean
}

function findMatchingPosition(positions: PositionInfo[], token0?: Token, token1?: Token, feeTier?: number) {
  return positions?.find(
    (position) =>
      (position?.details.token0.toLowerCase() === token0?.address ||
        position?.details.token0.toLowerCase() === token1?.address) &&
      (position?.details.token1.toLowerCase() === token0?.address ||
        position?.details.token1.toLowerCase() === token1?.address) &&
      position?.details.fee == feeTier &&
      !position.closed,
  )
}

export function PoolDetailsStatsButtons({ chainId, token0, token1, feeTier, loading }: PoolDetailsStatsButtonsProps) {
  const account = useAccount()
  const { positions: userOwnedPositions } = useMultiChainPositions(
    account.address ?? '',
    chainId ? [chainId] : undefined,
  )
  const position = userOwnedPositions && findMatchingPosition(userOwnedPositions, token0, token1, feeTier)
  const tokenId = position?.details.tokenId
  const switchChain = useSwitchChain()
  const navigate = useNavigate()
  const location = useLocation()
  const currency0 = token0 && gqlToCurrency(token0)
  const currency1 = token1 && gqlToCurrency(token1)

  // Mobile Balance Data
  const { data: balanceQuery } = useTokenBalancesQuery()
  const { balance0, balance1, balance0Fiat, balance1Fiat } = useMemo(() => {
    const filteredBalances = balanceQuery?.portfolios?.[0]?.tokenBalances?.filter(
      (tokenBalance) => tokenBalance?.token?.chain === chainIdToBackendChain({ chainId, withFallback: true }),
    )
    const tokenBalance0 = filteredBalances?.find((tokenBalance) => tokenBalance?.token?.address === token0?.address)
    const tokenBalance1 = filteredBalances?.find((tokenBalance) => tokenBalance?.token?.address === token1?.address)
    return {
      balance0: tokenBalance0?.quantity ?? 0,
      balance1: tokenBalance1?.quantity ?? 0,
      balance0Fiat: tokenBalance0?.denominatedValue?.value ?? 0,
      balance1Fiat: tokenBalance1?.denominatedValue?.value ?? 0,
    }
  }, [balanceQuery?.portfolios, chainId, token0?.address, token1?.address])
  const { formatNumber } = useFormatter()
  const formattedBalance0 = formatNumber({
    input: balance0,
    type: NumberType.TokenNonTx,
  })
  const formattedBalance1 = formatNumber({
    input: balance1,
    type: NumberType.TokenNonTx,
  })
  const totalFiatValue = balance0Fiat + balance1Fiat
  const formattedFiatValue = formatNumber({
    input: totalFiatValue,
    type: NumberType.PortfolioBalance,
  })

  const handleAddLiquidity = async () => {
    if (currency0 && currency1) {
      if (account.chainId !== chainId && chainId) {
        await switchChain(chainId)
      }
      navigate(`/add/${currencyId(currency0)}/${currencyId(currency1)}/${feeTier}${tokenId ? `/${tokenId}` : ''}`, {
        state: { from: location.pathname },
      })
    }
  }
  const [swapModalOpen, toggleSwapModalOpen] = useReducer((state) => !state, false)
  const isScreenSize = useScreenSize()
  const screenSizeLargerThanTablet = isScreenSize['lg']
  const isMobile = !isScreenSize['sm']
  const token0Warning = useTokenWarning(token0?.address, chainId)
  const token1Warning = useTokenWarning(token1?.address, chainId)
  const priorityWarning = getPriorityWarning(token0Warning, token1Warning)

  if (loading || !currency0 || !currency1) {
    return (
      <PoolDetailsStatsButtonsRow data-testid="pdp-buttons-loading-skeleton">
        <MobileBalance>
          <ButtonBubble />
        </MobileBalance>
        <ButtonBubble />
        <ButtonBubble />
      </PoolDetailsStatsButtonsRow>
    )
  }

  return (
    <Column gap="lg">
      <PoolDetailsStatsButtonsRow>
        {account.address && (
          <MobileBalance>
            <ThemedText.SubHeaderSmall>
              <Trans i18nKey="pool.yourBalances" />
            </ThemedText.SubHeaderSmall>
            <Row gap="8px">
              <ThemedText.HeadlineSmall>
                {formattedBalance0} {currency0.symbol}
              </ThemedText.HeadlineSmall>
              <ThemedText.HeadlineSmall color="neutral3">|</ThemedText.HeadlineSmall>
              <ThemedText.HeadlineSmall>
                {formattedBalance1} {currency1.symbol}
              </ThemedText.HeadlineSmall>
              {Boolean(totalFiatValue) && !isMobile && <ThemedText.Caption>({formattedFiatValue})</ThemedText.Caption>}
            </Row>
          </MobileBalance>
        )}
        <PoolButton
          onClick={toggleSwapModalOpen}
          $open={swapModalOpen}
          $fixedWidth={Boolean(account.address)}
          data-testid={`pool-details-${swapModalOpen ? 'close' : 'swap'}-button`}
        >
          {swapModalOpen ? (
            <>
              {screenSizeLargerThanTablet && <X size={20} />}
              <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
                <Trans i18nKey="common.close" />
              </ThemedText.BodyPrimary>
            </>
          ) : (
            <>
              {screenSizeLargerThanTablet && <SwapIcon />}
              <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
                <Trans i18nKey="common.swap" />
              </ThemedText.BodyPrimary>
            </>
          )}
        </PoolButton>
        <PoolButton
          onClick={handleAddLiquidity}
          data-testid="pool-details-add-liquidity-button"
          $fixedWidth={Boolean(account.address)}
          $hideOnMobile
        >
          {screenSizeLargerThanTablet && <Plus size={20} />}
          <ThemedText.BodyPrimary fontWeight={535} color="accentActive">
            <Trans i18nKey="common.addLiquidity" />
          </ThemedText.BodyPrimary>
        </PoolButton>
      </PoolDetailsStatsButtonsRow>
      <SwapModalWrapper open={swapModalOpen} data-testid="pool-details-swap-modal">
        <Swap
          syncTabToUrl={false}
          chainId={chainId}
          initialInputCurrency={currency0}
          initialOutputCurrency={currency1}
          compact
          disableTokenInputs={chainId !== account.chainId}
        />
        {Boolean(priorityWarning) && (
          <TokenSafetyMessage
            tokenAddress={(priorityWarning === token0Warning ? token0?.address : token1?.address) ?? ''}
            warning={priorityWarning ?? StrongWarning}
            plural={Boolean(token0Warning && token1Warning)}
            tokenSymbol={priorityWarning === token0Warning ? token0?.symbol : token1?.symbol}
          />
        )}
      </SwapModalWrapper>
      <Scrim
        $open={swapModalOpen && !screenSizeLargerThanTablet}
        $maxWidth={BREAKPOINTS.lg}
        $zIndex={Z_INDEX.sticky}
        onClick={toggleSwapModalOpen}
      />
    </Column>
  )
}
