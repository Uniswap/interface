import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Button, Flex, Spacer, styled, useIsTouchDevice, useMedia } from 'ui/src'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { Plus } from 'ui/src/components/icons/Plus'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { gqlToCurrency } from '~/appGraphql/data/util'
import { MobileBottomBar } from '~/components/NavBar/MobileBottomBar'
import { LoadingBubble } from '~/components/Tokens/loading'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getNextFlowStep } from '~/features/Liquidity/Create/flowSteps'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { getProtocolVersionFromLabel } from '~/features/Liquidity/utils/protocolVersion'
import { useAccount } from '~/hooks/useAccount'
import { ScrollDirection, useScroll } from '~/hooks/useScroll'
import { buildPoolSearchParams } from '~/pages/AddLiquidity/poolLinkParams'
import { PositionInfo } from '~/pages/PoolDetails/Pools/cache'
import { useMultiChainPositions } from '~/pages/PoolDetails/Pools/hooks/useMultiChainPositions'
import { Swap } from '~/pages/Swap'
import { getChainUrlParam } from '~/utils/params/chainParams'

const PoolDetailsStatsButtonsRow = styled(Flex, {
  row: true,
  gap: '$gap12',
  zIndex: 1,
  $xl: {
    gap: '$gap8',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    p: '$padding16',
    zIndex: zIndexes.sticky,
    '$platform-web': { position: 'fixed' },
  },
})

interface PoolDetailsStatsButtonsProps {
  chainId?: UniverseChainId
  poolIdOrAddress?: string
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  feeTier?: number
  tickSpacing?: number
  hookAddress?: string
  isDynamic?: boolean
  protocolVersion?: GraphQLApi.ProtocolVersion
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
  const media = useMedia()

  return (
    <Button
      onPress={onPress}
      icon={icon}
      variant={isOpen ? 'default' : 'branded'}
      emphasis={media.xl ? 'primary' : 'secondary'}
      data-testid={dataTestId}
    >
      {children}
    </Button>
  )
}

function findMatchingPosition({
  positions,
  token0,
  token1,
  feeTier,
}: {
  positions: PositionInfo[]
  token0?: GraphQLApi.Token
  token1?: GraphQLApi.Token
  feeTier?: number
}) {
  return positions.find(
    (position) =>
      (areAddressesEqual({
        addressInput1: { address: position.details.token0, platform: Platform.EVM },
        addressInput2: { address: token0?.address, platform: Platform.EVM },
      }) ||
        areAddressesEqual({
          addressInput1: { address: position.details.token0, platform: Platform.EVM },
          addressInput2: { address: token1?.address, platform: Platform.EVM },
        })) &&
      (areAddressesEqual({
        addressInput1: { address: position.details.token1, platform: Platform.EVM },
        addressInput2: { address: token0?.address, platform: Platform.EVM },
      }) ||
        areAddressesEqual({
          addressInput1: { address: position.details.token1, platform: Platform.EVM },
          addressInput2: { address: token1?.address, platform: Platform.EVM },
        })) &&
      position.details.fee === feeTier &&
      !position.closed,
  )
}

export function PoolDetailsStatsButtons({
  chainId,
  poolIdOrAddress,
  token0,
  token1,
  feeTier,
  tickSpacing,
  hookAddress,
  isDynamic,
  protocolVersion,
  loading,
}: PoolDetailsStatsButtonsProps) {
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)
  const account = useAccount()
  const { t } = useTranslation()
  const { positions: userOwnedPositions } = useMultiChainPositions(account.address ?? '')
  const position =
    userOwnedPositions && findMatchingPosition({ positions: userOwnedPositions, token0, token1, feeTier })
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
      const chainUrlParam = getChainUrlParam(chainId ?? currency0.chainId)

      if (tokenId) {
        navigate(`/positions/${protocolVersion?.toLowerCase()}/${chainUrlParam}/${tokenId}`, {
          state: { from: location.pathname },
        })
      } else if (isAddLiquidityRevamp && poolIdOrAddress) {
        const params = buildPoolSearchParams({
          currencyA: currency0Address,
          currencyB: currency1Address,
          chain: chainUrlParam,
          fee:
            feeTier !== undefined
              ? { feeAmount: feeTier, tickSpacing: tickSpacing ?? 0, isDynamic: isDynamic ?? false }
              : undefined,
          hookAddress,
          protocolVersion: protocolVersion?.toLowerCase(),
        })
        // The pool already exists here, so creatingPoolOrPair is false.
        const nextStep = getNextFlowStep({
          currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
          protocolVersion: getProtocolVersionFromLabel(protocolVersion?.toLowerCase()) ?? ProtocolVersion.V4,
          creatingPoolOrPair: false,
        })
        params.set('step', String(nextStep))
        const search = params.toString()
        navigate(`/positions/add/${chainUrlParam}/${poolIdOrAddress}${search ? `?${search}` : ''}`, {
          state: { from: location.pathname, entryPoint: location.pathname },
        })
      } else {
        const queryParams = new URLSearchParams()
        queryParams.set('currencyA', currency0Address)
        queryParams.set('currencyB', currency1Address)
        queryParams.set('chain', chainUrlParam)
        queryParams.set('fee', JSON.stringify({ feeAmount: feeTier, tickSpacing, isDynamic }))
        if (hookAddress) {
          queryParams.set('hook', hookAddress)
        }
        const url = `/positions/create/${protocolVersion?.toLowerCase()}?${queryParams.toString()}`
        navigate(url, {
          state: { from: location.pathname },
        })
      }
    }
  }
  const [swapModalOpen, setSwapModalOpen] = useState(false)

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
      <Flex row justifyContent="space-between" data-testid="pdp-buttons-loading-skeleton" mb="$spacing12">
        <LoadingBubble width="95%" containerProps={{ width: '50%' }} />
        <Spacer size="$spacing6" />
        <LoadingBubble width="95%" containerProps={{ width: '50%' }} />
      </Flex>
    )
  }

  return (
    <Flex flexDirection="column" gap="$gap24">
      <PoolButtonsWrapper isMobile={isMobile}>
        <Flex
          row
          justifyContent="center"
          gap={isMobile || screenSizeLargerThanTablet ? '$spacing12' : '$spacing16'}
          width="100%"
        >
          <PoolButton
            icon={swapModalOpen ? <X size="$icon.20" /> : <CoinConvert size="$icon.20" />}
            onPress={() => setSwapModalOpen((prev) => !prev)}
            isOpen={swapModalOpen}
            data-testid={`pool-details-${swapModalOpen ? 'close' : 'swap'}-button`}
          >
            {swapModalOpen ? t('common.close') : t('common.swap')}
          </PoolButton>
          <PoolButton
            icon={<Plus size="$icon.20" />}
            onPress={handleAddLiquidity}
            data-testid={TestID.PoolDetailsAddLiquidityButton}
          >
            {t('common.addLiquidity')}
          </PoolButton>
        </Flex>
      </PoolButtonsWrapper>
      <Modal
        name={ModalName.Swap}
        isModalOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        maxWidth={480}
        gap="$gap24"
      >
        <Flex gap="$gap24" data-testid="pool-details-swap-modal">
          <Swap
            syncTabToUrl={false}
            initialInputChainId={chainId}
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
        </Flex>
      </Modal>
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
