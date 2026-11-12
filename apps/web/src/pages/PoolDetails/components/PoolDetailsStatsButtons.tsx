import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId, areEvmAddressesEqual } from '@universe/chains'
import { Button, Flex, Flex as FlexCompat, type FlexCompatProps, Spacer, zIndexes } from '@universe/mycelium'
import { CoinConvert } from '@universe/mycelium/icons/CoinConvert'
import { Plus } from '@universe/mycelium/icons/Plus'
import { X } from '@universe/mycelium/icons/X'
import { useIsTouchDevice, useMedia } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { forwardRef, type ForwardRefExoticComponent, ReactNode, type RefAttributes, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import type { ParsedToken } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { v2TokenToCurrency } from 'uniswap/src/features/dataApi/utils/parsedToken'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenWarningCard } from 'uniswap/src/features/tokens/warnings/TokenWarningCard'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { LPGeoRestrictionBanner } from '~/components/GeoRestriction/LPGeoRestrictionBanner'
import { MobileBottomBar } from '~/components/MobileBottomBar/MobileBottomBar'
import { LoadingBubble } from '~/components/Tokens/loading'
import { useAccount } from '~/connection/hooks/useAccount'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getNextFlowStep } from '~/features/Liquidity/Create/flowSteps'
import { PositionFlowStep } from '~/features/Liquidity/Create/types'
import { useLPGeoRestriction } from '~/features/Liquidity/useLPGeoRestriction'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { ScrollDirection, useScroll } from '~/hooks/useScroll'
import { Swap } from '~/pages/Swap'
import { getChainUrlParam } from '~/utils/params/chainParams'
import { buildPoolSearchParams } from '~/utils/params/poolLinkParams'

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
  baseToken?: ParsedToken
  quoteToken?: ParsedToken
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

export function PoolDetailsStatsButtons({
  chainId,
  poolIdOrAddress,
  baseToken,
  quoteToken,
  feeTier,
  tickSpacing,
  hookAddress,
  isDynamic,
  protocolVersion,
  loading,
}: PoolDetailsStatsButtonsProps) {
  const account = useAccount()
  const { t } = useTranslation()
  // Default statuses are open-only positions, so a
  // closed position falls through to the add flow.
  const { allPositions: ownedPositions } = useWalletPositions({
    account: account.address ?? '',
    chainIds: chainId ? [chainId] : undefined,
    liquiditySearch: poolIdOrAddress,
  })
  // V2 pairs carry no tokenId, fall through to the add flow.
  const tokenId = ownedPositions.find(
    (position) =>
      (chainId === undefined || position.chainId === chainId) &&
      // poolId and the URL param are both the service's poolAddressOrId
      // (v2/v3 address, v4 id); areEvmAddressesEqual handles either.
      areEvmAddressesEqual(position.poolId, poolIdOrAddress),
  )?.tokenId

  const navigate = useNavigate()
  const location = useLocation()
  const protocolVersionLabel = protocolVersion !== undefined ? getProtocolVersionLabel(protocolVersion) : undefined
  const baseCurrency = baseToken && v2TokenToCurrency(baseToken)
  const quoteCurrency = quoteToken && v2TokenToCurrency(quoteToken)
  const baseCurrencyInfo = useCurrencyInfo(baseCurrency && currencyId(baseCurrency))
  const quoteCurrencyInfo = useCurrencyInfo(quoteCurrency && currencyId(quoteCurrency))

  // Drives the banner only. The CTA below only navigates; the add-liquidity flow it lands in gates on
  // the same hook before anything is signed.
  const { isGeoRestricted, restrictedTokenSymbol } = useLPGeoRestriction({
    token0: baseCurrency,
    token1: quoteCurrency,
  })

  const handleAddLiquidity = async () => {
    if (baseCurrency && quoteCurrency) {
      const baseCurrencyAddress = baseCurrency.isNative ? NATIVE_CHAIN_ID : baseCurrency.address
      const quoteCurrencyAddress = quoteCurrency.isNative ? NATIVE_CHAIN_ID : quoteCurrency.address
      const chainUrlParam = getChainUrlParam(chainId ?? baseCurrency.chainId)

      if (tokenId) {
        navigate(`/positions/${protocolVersionLabel}/${chainUrlParam}/${tokenId}`, {
          state: { from: location.pathname },
        })
      } else {
        const params = buildPoolSearchParams({
          currencyA: baseCurrencyAddress,
          currencyB: quoteCurrencyAddress,
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

  if (loading || !baseCurrency || !quoteCurrency) {
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
          {/* Shown even when restricted: the add flow opens on the region modal and keeps its CTA disabled. */}
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
            initialInputCurrency={baseCurrency}
            initialOutputCurrency={quoteCurrency}
          />
          <TokenWarningCard currencyInfo={baseCurrencyInfo} onPress={() => onWarningCardCtaPressed(baseCurrencyInfo)} />
          <TokenWarningCard
            currencyInfo={quoteCurrencyInfo}
            onPress={() => onWarningCardCtaPressed(quoteCurrencyInfo)}
          />
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
