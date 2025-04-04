import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import useMultiChainPositions from 'components/AccountDrawer/MiniPortfolio/Pools/useMultiChainPositions'
import { Scrim } from 'components/AccountDrawer/Scrim'
import { CurrencySelect } from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { MobileBottomBar } from 'components/NavBar/MobileBottomBar'
import { LoadingBubble } from 'components/Tokens/loading'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { gqlToCurrency } from 'graphql/data/util'
import { useAccount } from 'hooks/useAccount'
import { ScrollDirection, useScroll } from 'hooks/useScroll'
import styled from 'lib/styled-components'
import { Swap } from 'pages/Swap'
import { ReactNode, useCallback, useReducer, useState } from 'react'
import { Plus, X } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { Z_INDEX } from 'theme/zIndex'
import { Button, Flex, useIsTouchDevice, useMedia } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import { breakpoints } from 'ui/src/theme'
import { ProtocolVersion, Token } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TokenWarningCard } from 'uniswap/src/features/tokens/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'

const PoolDetailsStatsButtonsRow = styled(Row)`
  gap: 12px;
  z-index: 1;

  @media (max-width: ${breakpoints.xl}px) {
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
`

const ButtonBubble = styled(LoadingBubble)`
  height: 44px;
  width: 50%;
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

  // Need to override the default visibility to properly hide
  ${CurrencySelect} {
    visibility: ${({ open }) => (open ? 'visible' : 'hidden')};
  }

  @media (max-width: ${breakpoints.xl}px) {
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

interface PoolDetailsStatsButtonsProps {
  chainId?: UniverseChainId
  token0?: Token
  token1?: Token
  feeTier?: number
  protocolVersion?: ProtocolVersion
  loading?: boolean
}

interface PoolButtonProps {
  isOpen?: boolean
  icon?: JSX.Element
  onPress?: () => void
  children?: React.ReactNode
  'data-testid'?: string
}

const PoolButton = ({ isOpen, icon, onPress, children, 'data-testid': dataTestId }: PoolButtonProps) => {
  return (
    <Button
      onPress={onPress}
      icon={icon}
      variant={isOpen ? 'default' : 'branded'}
      emphasis="secondary"
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
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

export function PoolDetailsStatsButtons({
  chainId,
  token0,
  token1,
  feeTier,
  protocolVersion,
  loading,
}: PoolDetailsStatsButtonsProps) {
  const account = useAccount()
  const { t } = useTranslation()
  const { positions: userOwnedPositions } = useMultiChainPositions(account.address ?? '')
  const position = userOwnedPositions && findMatchingPosition(userOwnedPositions, token0, token1, feeTier)
  const tokenId = position?.details.tokenId

  const navigate = useNavigate()
  const location = useLocation()
  const currency0 = token0 && gqlToCurrency(token0)
  const currency1 = token1 && gqlToCurrency(token1)
  const currencyInfo0 = useCurrencyInfo(currency0 && currencyId(currency0))
  const currencyInfo1 = useCurrencyInfo(currency1 && currencyId(currency1))

  const handleAddLiquidity = async () => {
    if (currency0 && currency1) {
      const currency0Address = currency0.isNative ? NATIVE_CHAIN_ID : currency0.address
      const currency1Address = currency1.isNative ? NATIVE_CHAIN_ID : currency1.address
      const chainName = getChainInfo(chainId ?? currency0.chainId)?.urlParam

      if (tokenId) {
        navigate(`/positions/${protocolVersion?.toLowerCase()}/${chainName}/${tokenId}`, {
          state: { from: location.pathname },
        })
      } else {
        const url = `/positions/create/${protocolVersion?.toLowerCase()}?currencyA=${currency0Address}&currencyB=${currency1Address}&chain=${chainName}`
        navigate(url, {
          state: { from: location.pathname },
        })
      }
    }
  }
  const [swapModalOpen, toggleSwapModalOpen] = useReducer((state) => !state, false)

  const media = useMedia()
  const screenSizeLargerThanTablet = !media.xl
  const isMobile = media.md

  const [showWarningModal, setShowWarningModal] = useState(false)
  const closeWarningModal = useCallback(() => setShowWarningModal(false), [])
  const [warningModalCurrencyInfo, setWarningModalCurrencyInfo] = useState<Maybe<CurrencyInfo>>()
  const onWarningCardCtaPressed = useCallback((currencyInfo: Maybe<CurrencyInfo>) => {
    setWarningModalCurrencyInfo(currencyInfo)
    setShowWarningModal(true)
  }, [])

  if (loading || !currency0 || !currency1) {
    return (
      <PoolDetailsStatsButtonsRow data-testid="pdp-buttons-loading-skeleton">
        <ButtonBubble />
        <ButtonBubble />
      </PoolDetailsStatsButtonsRow>
    )
  }

  return (
    <Flex flexDirection="column" gap="$gap24">
      <PoolButtonsWrapper isMobile={isMobile}>
        <Flex row justifyContent="center" gap={screenSizeLargerThanTablet ? '$spacing12' : '$spacing8'} width="100%">
          <PoolButton
            icon={swapModalOpen ? <X size="$icon.20" /> : <ArrowUpDown size="$icon.20" />}
            onPress={toggleSwapModalOpen}
            isOpen={swapModalOpen}
            data-testid={`pool-details-${swapModalOpen ? 'close' : 'swap'}-button`}
          >
            {swapModalOpen ? t('common.close') : t('common.swap')}
          </PoolButton>
          <PoolButton
            icon={<Plus size="$icon.20" />}
            onPress={handleAddLiquidity}
            data-testid="pool-details-add-liquidity-button"
          >
            {t('common.addLiquidity')}
          </PoolButton>
        </Flex>
      </PoolButtonsWrapper>
      <SwapModalWrapper open={swapModalOpen} data-testid="pool-details-swap-modal">
        <Swap
          syncTabToUrl={false}
          chainId={chainId}
          initialInputCurrency={currency0}
          initialOutputCurrency={currency1}
        />
        <TokenWarningCard currencyInfo={currencyInfo0} onPress={() => onWarningCardCtaPressed(currencyInfo0)} />
        <TokenWarningCard currencyInfo={currencyInfo1} onPress={() => onWarningCardCtaPressed(currencyInfo1)} />
        {warningModalCurrencyInfo && (
          // Intentionally duplicative with the TokenWarningModal in the swap component; this one only displays when user clicks "i" Info button on the TokenWarningCard
          <TokenWarningModal
            currencyInfo0={warningModalCurrencyInfo}
            isInfoOnlyWarning
            isVisible={showWarningModal}
            closeModalOnly={closeWarningModal}
            onAcknowledge={closeWarningModal}
          />
        )}
      </SwapModalWrapper>
      <Scrim
        $open={swapModalOpen && !screenSizeLargerThanTablet}
        $maxWidth={breakpoints.xl}
        $zIndex={Z_INDEX.sticky}
        onClick={toggleSwapModalOpen}
      />
    </Flex>
  )
}

interface PoolButtonsWrapperProps {
  children: ReactNode
  isMobile: boolean
}

function PoolButtonsWrapper({ children, isMobile }: PoolButtonsWrapperProps) {
  const isTouchDevice = useIsTouchDevice()
  const { direction: scrollDirection } = useScroll()

  // Determine wrapper component for pool buttons based on viewport size
  const Wrapper = isMobile ? MobileBottomBar : PoolDetailsStatsButtonsRow
  const wrapperProps = isMobile ? { hide: isTouchDevice && scrollDirection === ScrollDirection.DOWN } : {}

  return <Wrapper {...wrapperProps}>{children}</Wrapper>
}
