import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import {
  CHART_HEIGHT,
  CHART_WIDTH,
  LiquidityPositionRangeChartLoader,
  WrappedLiquidityPositionRangeChart,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { AdaptiveDropdown } from 'components/Dropdowns/AdaptiveDropdown'
import { useGetRangeDisplay } from 'components/Liquidity/hooks/useGetRangeDisplay'
import {
  LiquidityPositionFeeStats,
  LiquidityPositionFeeStatsLoader,
  MinMaxRange,
} from 'components/Liquidity/LiquidityPositionFeeStats'
import { LiquidityPositionInfo, LiquidityPositionInfoLoader } from 'components/Liquidity/LiquidityPositionInfo'
import { PositionInfo, PriceOrdering } from 'components/Liquidity/types'
import { getBaseAndQuoteCurrencies } from 'components/Liquidity/utils/currency'
import { MouseoverTooltip } from 'components/Tooltip'
import { useAccount } from 'hooks/useAccount'
import useHoverProps from 'hooks/useHoverProps'
import { useLpIncentivesFormattedEarnings } from 'hooks/useLpIncentivesFormattedEarnings'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, FlexProps, Shine, styled, Text, TouchableArea, useIsTouchDevice, useMedia } from 'ui/src'
import { ArrowsLeftRight } from 'ui/src/components/icons/ArrowsLeftRight'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { Eye } from 'ui/src/components/icons/Eye'
import { EyeOff } from 'ui/src/components/icons/EyeOff'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Minus } from 'ui/src/components/icons/Minus'
import { MoreHorizontal } from 'ui/src/components/icons/MoreHorizontal'
import { Plus } from 'ui/src/components/icons/Plus'
import { RightArrow } from 'ui/src/components/icons/RightArrow'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { togglePositionVisibility } from 'uniswap/src/features/visibility/slice'
import { buildCurrencyId, currencyAddress } from 'uniswap/src/utils/currencyId'
import { getPoolDetailsURL } from 'uniswap/src/utils/linking'
import { NumberType } from 'utilities/src/format/types'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'

export function LiquidityPositionCardLoader() {
  return (
    <Shine>
      <Flex
        p="$spacing24"
        gap="$spacing24"
        borderWidth="$spacing1"
        borderRadius="$rounded20"
        borderColor="$surface3"
        width="100%"
        overflow="hidden"
        $md={{ gap: '$gap20' }}
      >
        <Flex
          row
          alignItems="center"
          justifyContent="space-between"
          $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
        >
          <LiquidityPositionInfoLoader />
          <LiquidityPositionRangeChartLoader height={CHART_HEIGHT} width={CHART_WIDTH} position="relative" />
        </Flex>
        <LiquidityPositionFeeStatsLoader />
      </Flex>
    </Shine>
  )
}

function useDropdownOptions({
  liquidityPosition,
  showVisibilityOption,
  isVisible,
}: {
  liquidityPosition: PositionInfo
  showVisibilityOption?: boolean
  isVisible?: boolean
}): MenuOptionItem[] {
  const { t } = useTranslation()
  const isOpenLiquidityPosition = liquidityPosition.status !== PositionStatus.CLOSED

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const account = useAccount()
  const switchChain = useSwitchChain()

  return useMemo(() => {
    const chainInfo = getChainInfo(liquidityPosition.chainId)

    const addLiquidityOption = {
      onPress: () => {
        dispatch(setOpenModal({ name: ModalName.AddLiquidity, initialState: liquidityPosition }))
      },
      label: t('common.addLiquidity'),
      Icon: Plus,
    }

    const removeLiquidityOption: MenuOptionItem | undefined = isOpenLiquidityPosition
      ? {
          onPress: () => {
            dispatch(setOpenModal({ name: ModalName.RemoveLiquidity, initialState: liquidityPosition }))
          },
          label: t('pool.removeLiquidity'),
          Icon: Minus,
        }
      : undefined

    const poolInfoOption = {
      onPress: () => {
        if (!liquidityPosition.poolId) {
          return
        }

        navigate(getPoolDetailsURL(liquidityPosition.poolId, liquidityPosition.chainId))
      },
      label: t('pool.info'),
      Icon: InfoCircleFilled,
    }

    const hideOption: MenuOptionItem | undefined = showVisibilityOption
      ? {
          onPress: () => {
            dispatch(
              togglePositionVisibility({
                poolId: liquidityPosition.poolId,
                tokenId: liquidityPosition.tokenId,
                chainId: liquidityPosition.chainId,
              }),
            )
          },
          label: isVisible ? t('common.hide.button') : t('common.unhide'),
          Icon: isVisible ? EyeOff : Eye,
          showDivider: true,
        }
      : undefined

    if (liquidityPosition.version === ProtocolVersion.V2) {
      const migrateV2Option = isOpenLiquidityPosition
        ? {
            onPress: async () => {
              if (liquidityPosition.chainId !== account.chainId) {
                await switchChain(liquidityPosition.chainId)
              }
              navigate(`/migrate/v2/${liquidityPosition.liquidityToken.address}`)
            },
            label: t('pool.migrateLiquidity'),
            Icon: RightArrow,
          }
        : undefined

      return [
        isOpenLiquidityPosition ? addLiquidityOption : undefined, // closed v2 positions cannot re-add liquidity since the erc20 liquidity token is permanently burned when closed. whereas v3 positions can be re-opened
        removeLiquidityOption,
        migrateV2Option,
        poolInfoOption,
        hideOption,
      ].filter((o): o is MenuOptionItem => o !== undefined)
    }

    const collectFeesOption: MenuOptionItem | undefined = isOpenLiquidityPosition
      ? {
          onPress: () => {
            dispatch(
              setOpenModal({
                name: ModalName.ClaimFee,
                initialState: liquidityPosition,
              }),
            )
          },
          label: t('pool.collectFees'),
          Icon: Dollar,
        }
      : undefined

    const showMigrateV3Option =
      isOpenLiquidityPosition &&
      !isV4UnsupportedChain(liquidityPosition.chainId) &&
      liquidityPosition.version !== ProtocolVersion.V4

    const migrateV3Option: MenuOptionItem | undefined = showMigrateV3Option
      ? {
          onPress: () => {
            navigate(`/migrate/v3/${chainInfo.urlParam}/${liquidityPosition.tokenId}`)
          },
          label: t('pool.migrateLiquidity'),
          Icon: RightArrow,
        }
      : undefined

    return [
      collectFeesOption,
      addLiquidityOption,
      removeLiquidityOption,
      migrateV3Option,
      poolInfoOption,
      hideOption,
    ].filter((o): o is MenuOptionItem => o !== undefined)
  }, [
    account.chainId,
    dispatch,
    isOpenLiquidityPosition,
    isVisible,
    liquidityPosition,
    navigate,
    showVisibilityOption,
    switchChain,
    t,
  ])
}

export function LiquidityPositionCard({
  liquidityPosition,
  isMiniVersion,
  showVisibilityOption,
  showMigrateButton = false,
  isVisible = true,
  disabled = false,
  isLast = false,
  onMenuOpenChange,
}: {
  liquidityPosition: PositionInfo
  isMiniVersion?: boolean
  showVisibilityOption?: boolean
  showMigrateButton?: boolean
  isVisible?: boolean
  disabled?: boolean
  isLast?: boolean
  onMenuOpenChange?: (isOpen: boolean) => void
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isTouchDevice = useIsTouchDevice()
  const [priceInverted, setPriceInverted] = useState(false)
  const isLPIncentivesEnabled = useFeatureFlag(FeatureFlags.LpIncentives)

  const [hover, hoverProps] = useHoverProps()
  const media = useMedia()
  const isSmallScreen = media.sm

  const { fee0Amount, fee1Amount } = liquidityPosition
  const fiatFeeValue0 = useUSDCValue(fee0Amount, PollingInterval.Slow)
  const fiatFeeValue1 = useUSDCValue(fee1Amount, PollingInterval.Slow)
  const fiatValue0 = useUSDCValue(liquidityPosition.currency0Amount, PollingInterval.Slow)
  const fiatValue1 = useUSDCValue(liquidityPosition.currency1Amount, PollingInterval.Slow)
  const priceOrdering = useMemo(() => {
    if (liquidityPosition.version === ProtocolVersion.V2 || !liquidityPosition.position) {
      return {}
    }

    const position = liquidityPosition.position
    const token0 = position.amount0.currency
    const token1 = position.amount1.currency

    return {
      priceLower: position.token0PriceLower,
      priceUpper: position.token0PriceUpper,
      quote: token1,
      base: token0,
    }
  }, [liquidityPosition])

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(
    {
      TOKEN0: liquidityPosition.currency0Amount.currency,
      TOKEN1: liquidityPosition.currency1Amount.currency,
    },
    priceInverted,
  )

  const formattedUsdValue =
    fiatValue0 && fiatValue1
      ? convertFiatAmountFormatted(fiatValue0.add(fiatValue1).toExact(), NumberType.FiatTokenPrice)
      : undefined

  const { totalFormattedEarnings, hasRewards, formattedFeesValue } = useLpIncentivesFormattedEarnings({
    liquidityPosition,
    fiatFeeValue0,
    fiatFeeValue1,
  })

  const currency0Id =
    liquidityPosition.version === ProtocolVersion.V4
      ? buildCurrencyId(liquidityPosition.chainId, currencyAddress(liquidityPosition.currency0Amount.currency))
      : undefined
  const currency1Id =
    liquidityPosition.version === ProtocolVersion.V4
      ? buildCurrencyId(liquidityPosition.chainId, currencyAddress(liquidityPosition.currency1Amount.currency))
      : undefined

  const currency0Info = useCurrencyInfo(currency0Id)
  const currency1Info = useCurrencyInfo(currency1Id)

  const dropdownOptions = useDropdownOptions({
    liquidityPosition,
    showVisibilityOption,
    isVisible,
  })

  const priceOrderingForChart = useMemo(() => {
    if (
      (liquidityPosition.version !== ProtocolVersion.V3 && liquidityPosition.version !== ProtocolVersion.V4) ||
      !liquidityPosition.position ||
      !liquidityPosition.liquidity ||
      !liquidityPosition.tickLower ||
      !liquidityPosition.tickUpper
    ) {
      return {}
    }
    return {
      base: baseCurrency,
      priceLower: priceInverted
        ? liquidityPosition.position.token0PriceUpper.invert()
        : liquidityPosition.position.token0PriceLower,
      priceUpper: priceInverted
        ? liquidityPosition.position.token0PriceLower.invert()
        : liquidityPosition.position.token0PriceUpper,
    }
  }, [liquidityPosition, baseCurrency, priceInverted])

  return (
    <>
      {isMiniVersion ? (
        <MiniPositionCard
          menuOptions={dropdownOptions}
          disabled={disabled}
          positionInfo={liquidityPosition}
          formattedUsdValue={formattedUsdValue}
          formattedUsdFees={formattedFeesValue}
          priceOrdering={priceOrdering}
          tickSpacing={liquidityPosition.tickSpacing}
          tickLower={liquidityPosition.tickLower}
          tickUpper={liquidityPosition.tickUpper}
          isLast={isLast}
          onMenuOpenChange={onMenuOpenChange}
        />
      ) : (
        <Flex
          {...hoverProps}
          group
          position="relative"
          gap="$spacing16"
          borderWidth="$spacing1"
          borderRadius="$rounded20"
          borderColor="$surface3"
          width="100%"
          hoverStyle={!disabled ? { borderColor: '$surface3Hovered', backgroundColor: '$surface1Hovered' } : {}}
        >
          <Flex
            row
            pt="$spacing24"
            px="$spacing24"
            alignItems="center"
            justifyContent="space-between"
            overflow="hidden"
            $md={{ row: false, alignItems: 'flex-start', gap: '$gap20' }}
          >
            <LiquidityPositionInfo
              positionInfo={liquidityPosition}
              isMiniVersion={isSmallScreen}
              showMigrateButton={showMigrateButton}
            />
            <WrappedLiquidityPositionRangeChart
              version={liquidityPosition.version}
              chainId={liquidityPosition.chainId}
              quoteCurrency={quoteCurrency}
              baseCurrency={baseCurrency}
              sdkCurrencies={{
                TOKEN0: liquidityPosition.currency0Amount.currency,
                TOKEN1: liquidityPosition.currency1Amount.currency,
              }}
              priceInverted={priceInverted}
              positionStatus={liquidityPosition.status}
              poolAddressOrId={liquidityPosition.poolId}
              priceOrdering={priceOrderingForChart}
            />
            <Flex $md={{ display: 'block' }} display="none" width="100%">
              <MinMaxRange
                priceOrdering={priceOrdering}
                tickLower={liquidityPosition.tickLower}
                tickUpper={liquidityPosition.tickUpper}
                tickSpacing={liquidityPosition.tickSpacing}
                pricesInverted={priceInverted}
                setPricesInverted={setPriceInverted}
              />
            </Flex>
          </Flex>
          <LiquidityPositionFeeStats
            formattedUsdValue={formattedUsdValue}
            formattedUsdFees={formattedFeesValue}
            formattedLpIncentiveEarnings={totalFormattedEarnings}
            hasRewards={hasRewards}
            priceOrdering={priceOrdering}
            tickSpacing={liquidityPosition.tickSpacing}
            tickLower={liquidityPosition.tickLower}
            tickUpper={liquidityPosition.tickUpper}
            version={liquidityPosition.version}
            currency0Info={currency0Info}
            currency1Info={currency1Info}
            apr={liquidityPosition.apr}
            cardHovered={hover && !disabled}
            pricesInverted={priceInverted}
            setPricesInverted={setPriceInverted}
            lpIncentiveRewardApr={
              isLPIncentivesEnabled && liquidityPosition.version === ProtocolVersion.V4
                ? liquidityPosition.boostedApr
                : undefined
            }
            totalApr={
              isLPIncentivesEnabled && liquidityPosition.version === ProtocolVersion.V4
                ? liquidityPosition.totalApr
                : undefined
            }
          />
          {!isTouchDevice && !disabled && <PositionDropdownMoreMenu menuOptions={dropdownOptions} isLast={isLast} />}
        </Flex>
      )}
    </>
  )
}

function MiniPositionCard({
  positionInfo,
  menuOptions,
  formattedUsdFees,
  formattedUsdValue,
  priceOrdering,
  tickSpacing,
  tickLower,
  tickUpper,
  disabled,
  isLast = false,
  onMenuOpenChange,
}: {
  positionInfo: PositionInfo
  menuOptions: MenuOptionItem[]
  formattedUsdFees?: string
  formattedUsdValue?: string
  priceOrdering: PriceOrdering
  tickSpacing?: number
  tickLower?: number
  tickUpper?: number
  disabled?: boolean
  isLast?: boolean
  onMenuOpenChange?: (isOpen: boolean) => void
}) {
  const { t } = useTranslation()
  const [pricesInverted, setPricesInverted] = useState(false)

  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol, isFullRange } = useGetRangeDisplay({
    priceOrdering,
    tickSpacing,
    tickLower,
    tickUpper,
    pricesInverted,
  })

  return (
    <Flex
      gap="$gap20"
      p="$padding16"
      borderRadius="$rounded20"
      borderColor="$surface3"
      borderWidth="$spacing1"
      position="relative"
      group
      hoverStyle={!disabled ? { backgroundColor: '$surface1Hovered', borderColor: '$surface3Hovered' } : {}}
      pressStyle={!disabled ? { backgroundColor: '$surface1Pressed', borderColor: '$surface3Pressed' } : {}}
    >
      <LiquidityPositionInfo hideStatusIndicator positionInfo={positionInfo} currencyLogoSize={32} isMiniVersion />
      <Flex row gap="$gap12">
        <Flex>
          {formattedUsdValue ? (
            <Text variant="body2">{formattedUsdValue}</Text>
          ) : (
            <MouseoverTooltip text={t('position.valueUnavailable')} placement="top">
              <Text variant="body2">-</Text>
            </MouseoverTooltip>
          )}
          <Text variant="body4" color="$neutral2">
            {t('pool.position')}
          </Text>
        </Flex>
        <Flex>
          <Text variant="body2">{formattedUsdFees || t('common.unavailable')}</Text>
          <Text variant="body4" color="$neutral2">
            {t('common.fees')}
          </Text>
        </Flex>
      </Flex>
      {priceOrdering.priceLower && priceOrdering.priceUpper && !isFullRange ? (
        <TouchableArea
          {...ClickableTamaguiStyle}
          onPress={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setPricesInverted((prevInverted) => !prevInverted)
          }}
        >
          <Flex row gap={10}>
            <Text variant="body4">
              {minPrice} {tokenASymbol} / {tokenBSymbol}
            </Text>
            <ArrowsLeftRight color="$neutral2" size="$icon.16" />
            <Text variant="body4">
              {maxPrice} {tokenASymbol} / {tokenBSymbol}
            </Text>
          </Flex>
        </TouchableArea>
      ) : (
        <Text variant="body4">{t('common.fullRange')}</Text>
      )}
      <PositionDropdownMoreMenu menuOptions={menuOptions} isLast={isLast} onOpenChange={onMenuOpenChange} />
    </Flex>
  )
}

const activeStyle: FlexProps = { opacity: 1, pointerEvents: 'auto', backgroundColor: '$scrim' }
const PositionDetailsMenuButton = styled(Flex, {
  animation: 'fast',
  opacity: 0,
  borderRadius: '$rounded12',
  p: '$spacing8',
  variants: {
    open: {
      true: activeStyle,
    },
  },
})

function PositionDropdownMoreMenu({
  menuOptions,
  isLast,
  onOpenChange,
}: {
  menuOptions: MenuOptionItem[]
  isLast: boolean
  onOpenChange?: (isOpen: boolean) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    onOpenChange?.(open)
  }

  const dropdownTrigger = (
    <Flex
      zIndex={zIndexes.mask}
      onPress={(event) => {
        event.preventDefault()
        event.stopPropagation()
        handleOpenChange(!isOpen)
      }}
    >
      <PositionDetailsMenuButton $group-hover={activeStyle} open={isOpen} onPress={() => {}}>
        <MoreHorizontal size="$icon.16" color="white" />
      </PositionDetailsMenuButton>
    </Flex>
  )

  return (
    <Flex position="absolute" top="$spacing16" right="$spacing16">
      <AdaptiveDropdown
        alignRight
        allowFlip
        positionFixed
        forceFlipUp={isLast}
        isOpen={isOpen}
        toggleOpen={handleOpenChange}
        trigger={dropdownTrigger}
        dropdownStyle={{
          p: 0,
          backgroundColor: 'transparent',
          borderRadius: '$rounded20',
          minWidth: 'max-content',
          borderWidth: 0,
        }}
      >
        <MenuContent items={menuOptions} handleCloseMenu={() => handleOpenChange(false)} />
      </AdaptiveDropdown>
    </Flex>
  )
}
