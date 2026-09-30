import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId, Platform, areAddressesEqual } from '@universe/chains'
import { Button, Flex, Flex as FlexCompat, type FlexCompatProps, Spacer } from '@universe/mycelium'
import { useIsTouchDevice, useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { forwardRef, type ForwardRefExoticComponent, ReactNode, type RefAttributes, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { CoinConvert } from 'ui/src/components/icons/CoinConvert'
import { Plus } from 'ui/src/components/icons/Plus'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { LPGeoRestrictionBanner } from '~/components/GeoRestriction/LPGeoRestrictionBanner'
import { MobileBottomBar } from '~/components/NavBar/MobileBottomBar'
import { LoadingBubble } from '~/components/Tokens/loading'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getNextFlowStep } from '~/features/Liquidity/Create/flowSteps'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { useAccount } from '~/hooks/useAccount'
import { ScrollDirection, useScroll } from '~/hooks/useScroll'
import { buildPoolSearchParams } from '~/pages/AddLiquidity/poolLinkParams'
import { PositionInfo } from '~/pages/PoolDetails/Pools/cache'
import { useMultiChainPositions } from '~/pages/PoolDetails/Pools/hooks/useMultiChainPositions'
import { Swap } from '~/pages/Swap'
import { getChainUrlParam } from '~/utils/params/chainParams'

// `$xl` stays `$xl`: mycelium's `media-xl` is `(max-width: 1024px)`; Tailwind's stock `xl:` is the inversion.
// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
const PoolDetailsStatsButtonsRow: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, FlexCompatProps>(function PoolDetailsStatsButtonsRow({ $xl: xl, ...props }, ref) {
    return (
      <FlexCompat
        ref={ref}
        row
        gap="$gap12"
        zIndex={1}
        // Merge, don't spread: Tamagui deep-merged a caller's object-valued prop into the config's value for the same key.
        $xl={{
          gap: '$gap8',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          p: '$padding16',
          zIndex: zIndexes.sticky,
          position: 'fixed',
          ...xl,
        }}
        {...props}
      />
    )
  })

interface PoolDetailsStatsButtonsProps {
  chainId?: UniverseChainId
  poolIdOrAddress: string
  token0?: ParsedToken
  token1?: ParsedToken
  feeTier?: number
  tickSpacing?: number
  hookAddress?: string
  isDynamic?: boolean
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
  token0?: ParsedToken
  token1?: ParsedToken
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
  const account = useAccount()
  const { t } = useTranslation()
  const { positions: userOwnedPositions } = useMultiChainPositions(account.address ?? '')
  const position =
    userOwnedPositions && findMatchingPosition({ positions: userOwnedPositions, token0, token1, feeTier })
  const tokenId = position?.details.tokenId

  const navigate = useNavigate()
  const location = useLocation()
  const protocolVersionLabel = protocolVersion !== undefined ? getProtocolVersionLabel(protocolVersion) : undefined
  const currency0 = token0 && v2TokenToCurrency(token0)
  const currency1 = token1 && v2TokenToCurrency(token1)
  const currencyInfo0 = useCurrencyInfo(currency0 && currencyId(currency0))
  const currencyInfo1 = useCurrencyInfo(currency1 && currencyId(currency1))

  // Fails open while the check is in flight, as swap does: this CTA only navigates, and the
  // add-liquidity flow it lands in gates again on the same hook before anything is signed.
  const { isGeoRestricted, restrictedTokenSymbol } = useLPGeoRestriction({
    token0: currency0,
    token1: currency1,
  })

  const handleAddLiquidity = async () => {
    if (currency0 && currency1) {
      const currency0Address = currency0.isNative ? NATIVE_CHAIN_ID : currency0.address
      const currency1Address = currency1.isNative ? NATIVE_CHAIN_ID : currency1.address
      const chainUrlParam = getChainUrlParam(chainId ?? currency0.chainId)

      if (tokenId) {
        navigate(`/positions/${protocolVersionLabel}/${chainUrlParam}/${tokenId}`, {
          state: { from: location.pathname },
        })
      } else {
        const params = buildPoolSearchParams({
          currencyA: currency0Address,
          currencyB: currency1Address,
          chain: chainUrlParam,
          fee:
            feeTier !== undefined
              ? { feeAmount: feeTier, tickSpacing: tickSpacing ?? 0, isDynamic: isDynamic ?? false }
              : undefined,
          hookAddress,
          protocolVersion: protocolVersionLabel,
        })
        // The pool already exists here, so creatingPoolOrPair is false.
        const nextStep = getNextFlowStep({
          currentStep: PositionFlowStep.SELECT_TOKENS_AND_FEE_TIER,
          protocolVersion: protocolVersion ?? ProtocolVersion.V4,
          creatingPoolOrPair: false,
        })
        params.set('step', String(nextStep))
        const search = params.toString()
        navigate(`/positions/add/${chainUrlParam}/${poolIdOrAddress}${search ? `?${search}` : ''}`, {
          state: { from: location.pathname, entryPoint: location.pathname },
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
      {/* The banner renders in the column rather than inside PoolButtonsWrapper because on mobile that
          wrapper is MobileBottomBar — a fixed 100px-max strip that translates away on scroll. */}
      {isGeoRestricted && <LPGeoRestrictionBanner tokenSymbol={restrictedTokenSymbol} />}
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
          {/* Dropped rather than disabled — the banner above already states the restriction, so a
              dead half of the row would only repeat it. */}
          {!isGeoRestricted && (
            <PoolButton
              icon={<Plus size="$icon.20" />}
              onPress={handleAddLiquidity}
              data-testid={TestID.PoolDetailsAddLiquidityButton}
            >
              {t('common.addLiquidity')}
            </PoolButton>
          )}
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

  // The two wrappers no longer share a prop type, so they cannot be aliased into one variable.
  if (isMobile) {
    return (
      <MobileBottomBar hide={isTouchDevice && scrollDirection === ScrollDirection.DOWN}>{children}</MobileBottomBar>
    )
  }

  return <PoolDetailsStatsButtonsRow>{children}</PoolDetailsStatsButtonsRow>
}
